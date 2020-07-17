function ValidationFactory() {

}

class DefaultValidation {
    constructor (schema) {
        if (schema) {
            this.schema = schema
        } else {
            this.schema = {
                agent: "string",
                role: "string"
            }
        }
        
    }

    validate(obj) {
        for (var key in this.schema) {
            if (typeof obj[key] != this.schema[key])
                throw Error(`schema error, expected ${key} to be of type ${this.schema[key]}, got ${typeof obj[key]}`)
        }
    }
}