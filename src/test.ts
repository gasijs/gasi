import { readFileSync } from "fs";
import { compile } from "./index";

const example_code = readFileSync("src/example.solid", "utf-8");

console.log(compile(example_code));
