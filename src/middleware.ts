import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])
const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Redirect unauthenticated users trying to access protected routes
  if (!userId && isProtectedRoute(req)) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname)
    return Response.redirect(signInUrl)
  }

  // Redirect authenticated users away from auth pages to dashboard
  if (userId && isAuthRoute(req)) {
    return Response.redirect(new URL('/dashboard/forms', req.url))
  }

  // Redirect /dashboard to /dashboard/forms
  if (userId && req.nextUrl.pathname === '/dashboard') {
    return Response.redirect(new URL('/dashboard/forms', req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}