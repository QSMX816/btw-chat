// pdfjs worker + mammoth 浏览器构建没有自带类型，手动声明
declare module 'mammoth/mammoth.browser';
declare module '*?worker' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}
