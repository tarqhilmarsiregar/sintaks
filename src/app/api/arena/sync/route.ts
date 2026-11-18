import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/admin';
import { SupabaseArenaRepo } from '@/lib/supabase/repository';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/security/session';
import { Submission, User } from '@/types/arena';

/**
 * Hardened Supabase Live State Sync Endpoint
 * - Requires cryptographically signed HttpOnly session cookie (cp_arena_session)
 * - Ignores untrusted ?role= or ?nim= query parameters
 * - Enforces per-entity RBAC on POST mutations
 */
export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        mode: 'local',
        configured: false,
        message: 'Supabase belum dikonfigurasi. Menggunakan penyimpanan lokal.',
      });
    }

    // Verifikasi sesi kriptografis dari HttpOnly cookie (Anti-Spoofing)
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          mode: 'supabase',
          configured: true,
          error: 'Akses ditolak (401): Silakan login terlebih dahulu untuk mengakses data sinkronisasi.',
        },
        { status: 401 }
      );
    }

    // Role & NIM diambil MUTLAK dari session cookie terverifikasi (bukan dari query string!)
    const data = await SupabaseArenaRepo.fetchAllState({
      role: session.role,
      nim: session.nim,
    });

    if (!data) {
      return NextResponse.json({
        success: true,
        mode: 'local',
        configured: false,
      });
    }

    return NextResponse.json({
      success: true,
      mode: 'supabase',
      configured: true,
      sessionRole: session.role,
      syncedAt: new Date().toISOString(),
      data,
    });
  } catch (error: any) {
    console.error('Supabase GET /api/arena/sync error:', error);
    return NextResponse.json(
      {
        success: false,
        mode: 'local',
        configured: isSupabaseConfigured(),
        error: error?.message || 'Gagal menyinkronkan data dari Supabase.',
      },
      { status: 500 }
    );
  }
}

const ADMIN_ONLY_ENTITIES = new Set(['cohorts', 'games', 'questions', 'reset-all']);

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        mode: 'local',
        configured: false,
        synced: false,
      });
    }

    // Wajib sesi terverifikasi untuk seluruh mutasi database
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Akses ditolak (401): Sesi login tidak valid.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { entity, items } = body;

    if (!entity || typeof entity !== 'string') {
      return NextResponse.json(
        { error: 'Parameter entity wajib disertakan.' },
        { status: 400 }
      );
    }

    // Proteksi RBAC ketat: Entitas administratif hanya boleh dimutasi oleh ADMIN
    if (ADMIN_ONLY_ENTITIES.has(entity) && session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: `Akses ditolak (403): Hanya ADMIN yang berwenang memodifikasi "${entity}".` },
        { status: 403 }
      );
    }

    let count = 0;

    switch (entity) {
      case 'cohorts':
        count = await SupabaseArenaRepo.syncCohorts(Array.isArray(items) ? items : []);
        break;
      case 'teams': {
        const allTeams = Array.isArray(items) ? items : [];
        if (session.role === 'ADMIN') {
          count = await SupabaseArenaRepo.syncTeams(allTeams);
        } else {
          // Mahasiswa hanya boleh upsert tim yang melibatkan dirinya sendiri (non-destruktif terhadap tim lain)
          const ownTeams = allTeams.filter(
            (t: any) =>
              t?.leader_nim?.toUpperCase() === session.nim.toUpperCase() ||
              (Array.isArray(t?.daftar_nim_json) &&
                t.daftar_nim_json.some((n: string) => String(n).toUpperCase() === session.nim.toUpperCase()))
          );
          count = await SupabaseArenaRepo.upsertTeamsNonDestructive(ownTeams);
        }
        break;
      }
      case 'users': {
        if (session.role === 'ADMIN') {
          count = await SupabaseArenaRepo.syncUsers(Array.isArray(items) ? items : []);
        } else {
          // Mahasiswa hanya boleh memperbarui profil miliknya sendiri secara non-destruktif
          const allItems: User[] = Array.isArray(items) ? items : [];
          const selfItem = allItems.find((u) => u.nim.toUpperCase() === session.nim.toUpperCase());
          if (!selfItem) {
            return NextResponse.json(
              { error: 'Akses ditolak (403): Peserta tidak berwenang memodifikasi data pengguna lain.' },
              { status: 403 }
            );
          }
          await SupabaseArenaRepo.updateSingleUserProfile(session.nim, {
            codename: selfItem.codename,
            avatar: selfItem.avatar,
            id_tim: selfItem.id_tim,
          });
          count = 1;
        }
        break;
      }
      case 'games':
        count = await SupabaseArenaRepo.syncGames(Array.isArray(items) ? items : []);
        break;
      case 'questions':
        count = await SupabaseArenaRepo.syncQuestions(Array.isArray(items) ? items : []);
        break;
      case 'submissions': {
        const allSubs: Submission[] = Array.isArray(items) ? items : [];
        if (session.role === 'ADMIN') {
          count = await SupabaseArenaRepo.syncSubmissions(allSubs);
        } else {
          // Isolasi kepemilikan: mahasiswa hanya boleh menyinkronkan submisi miliknya sendiri
          const ownSubs = allSubs.filter((s) => s.nim.toUpperCase() === session.nim.toUpperCase());
          count = await SupabaseArenaRepo.syncSubmissions(ownSubs);
        }
        break;
      }
      case 'reset-all':
        await SupabaseArenaRepo.resetAllTransactionalData();
        break;
      default:
        return NextResponse.json(
          { error: `Entity "${entity}" tidak didukung.` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      mode: 'supabase',
      configured: true,
      synced: true,
      entity,
      count,
      syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Supabase POST /api/arena/sync error:', error);
    return NextResponse.json(
      {
        success: false,
        mode: 'local',
        configured: isSupabaseConfigured(),
        error: error?.message || 'Gagal menyimpan perubahan ke Supabase.',
      },
      { status: 500 }
    );
  }
}
