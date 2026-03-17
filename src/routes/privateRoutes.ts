// Route yêu cầu đăng nhập

export interface RouteConfig {
  path: string;
  page: string;
}

export const privateRoutes: RouteConfig[] = [
{
  path: '/dashboard',
  page: 'dashboard'
},
{
  path: '/trees',
  page: 'trees'
},
{
  path: '/tree-detail',
  page: 'tree-detail'
},
{
  path: '/profile',
  page: 'profile'
},
{
  path: '/settings',
  page: 'settings'
}];