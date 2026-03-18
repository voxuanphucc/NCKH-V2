// Route không yêu cầu đăng nhập

export interface RouteConfig {
  path: string;
  page: string;
}

export const publicRoutes: RouteConfig[] = [
{
  path: '/login',
  page: 'login'
},
{
  path: '/register',
  page: 'register'
},
{
  path: '/share',
  page: 'share'
},
{
  path: '/accept-invitation',
  page: 'accept-invitation'
},
{
  path: '/oauth-callback',
  page: 'oauth-callback'
}];