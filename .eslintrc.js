module.exports = {
    "env": {
        "node": true
    },
    "extends": [
        "standard-with-typescript"
    ],
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "react",
        "eslint-plugin-prettier"

    ],
    "rules": {
    },
    "root": true
}
