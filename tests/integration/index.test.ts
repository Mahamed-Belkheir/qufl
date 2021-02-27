import Qufl from "../../lib/qufl";
import expressSetup from "./express-setup";
import testSetup from "./test-setup";


let memoryQufl = new Qufl({ secret: "hello world secret" });
let memoryExpress = expressSetup(memoryQufl);
let memoryTest = testSetup(memoryExpress);

describe('memory store test', memoryTest);
