console.log("Adding sql-wasm.js script tag");
const s = document.createElement("script");
s.setAttribute("src", "/sql-wasm.js");
document.body.appendChild(s);

window.loadSQL = async () => {
  if (typeof window.initSqlJs === "undefined") return;
  console.log("loadSQL function called");
  return await initSqlJs({
    locateFile: (file) => `/${file}`,
  });
};
