import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — IMPORTANT: do not remove this
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login (except public routes)
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  const isPublicAsset =
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon.ico");

  if (!user && !isAuthRoute && !isApiRoute && !isPublicAsset) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Role-based landing redirect for the root path. Doing this here (instead of
  // inside `app/page.tsx`) avoids a Next.js 16 dev-mode bug where calling
  // `redirect()` from a Server Component throws before its performance mark
  // closes, producing: "Failed to execute 'measure' on 'Performance':
  // 'RootPage' cannot have a negative time stamp."
  if (user && request.nextUrl.pathname === "/") {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = usuario?.rol === "vendedor" ? "/mis-tareas" : "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
