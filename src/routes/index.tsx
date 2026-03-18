// App Router chính
import { publicRoutes } from './publicRoutes';
import { privateRoutes } from './privateRoutes';
import type { RouteConfig } from './publicRoutes';
export function isPublicRoute(page: string): boolean {
  return publicRoutes.some((route) => route.page === page);
}
export function isPrivateRoute(page: string): boolean {
  return privateRoutes.some((route) => route.page === page);
}
export function getRouteByPage(page: string): RouteConfig | undefined {
  return (
    privateRoutes.find((route) => route.page === page) ||
    publicRoutes.find((route) => route.page === page));

}
export { publicRoutes, privateRoutes };
export type { RouteConfig };