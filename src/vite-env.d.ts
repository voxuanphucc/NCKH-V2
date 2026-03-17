/// <reference types="vite/client" />

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '@fontsource/roboto/*.css' {
  const content: string;
  export default content;
}
