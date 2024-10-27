import { EventEmitter } from "stream"
import { StoreFacade, StoreInterface } from "../../src/store";



describe("unit test - store", () => {
    it("should instantiate a store with config", () => {
        class DummyClass extends EventEmitter implements StoreInterface {
            constructor(_config: { foo: string }) {
                super();
            }
            get(_id: string, _cb?: ((err: Error | null, value: any) => void) | undefined): void {
                throw new Error("Method not implemented.");
            }
            set(_id: string, _value: any, _cb?: ((err: Error | null) => void) | undefined): void {
                throw new Error("Method not implemented.");
            }
            destroy(_id: string, _cb?: ((err: Error | null) => void) | undefined): void {
                throw new Error("Method not implemented.");
            }

        }


        new StoreFacade(() => DummyClass, { foo: "bar" });
    })
})