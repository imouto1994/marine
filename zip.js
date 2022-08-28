const AdmZip = require("adm-zip");

const zip = new AdmZip();

// Add files & folders
zip.addLocalFile("./marine.exe");
zip.addLocalFile("./marine.bat");
zip.addLocalFile("./localStorage.json.template");
zip.addLocalFile("./entries.json.template");

// Write zip
zip.writeZip("./marine.zip");
