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
                ".eslintrc.{js,cjs}",
                "./scripts/incrementVersion.js"
            ],
            "parserOptions": {
                "sourceType": "script"
            },

            extends: ['plugin:@typescript-eslint/disable-type-checked'],        
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
