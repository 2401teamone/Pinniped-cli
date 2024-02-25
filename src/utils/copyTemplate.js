import fs from "fs-extra";
import path from "path";

const copyTemplate = (template, newName) => {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const TEMPLATE_DIR = path.join(__dirname, `../templates/${template}`);

  //copy the template directory to the current directory give newName if provided
  if (newName === undefined) {
    fs.copySync(TEMPLATE_DIR, process.cwd());
  } else {
    fs.copySync(TEMPLATE_DIR, path.join(process.cwd(), newName));
  }
};

export default copyTemplate;
