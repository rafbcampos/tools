load("@npm//:defs.bzl", "npm_link_all_packages")
load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("//helpers:defs.bzl", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

dependencies = [
    ":node_modules/@player-tools/devtools-desktop-plugins-common",
    ":node_modules/@player-tools/devtools-types",
    ":node_modules/@player-tools/dsl",
    ":node_modules/@player-tools/cli",
    "//:node_modules/@player-ui/common-types-plugin",
    "//:node_modules/@player-ui/react",
    "//:node_modules/@player-ui/reference-assets-components",
    "//:node_modules/@player-ui/types",
    "//:node_modules/@types/react",
    "//:node_modules/react",
    "//:node_modules/immer",
    "//:node_modules/dset",
    "//:node_modules/dequal",
]

js_pipeline(
    package_name = "@player-tools/devtools-basic-web-plugin",
    deps = dependencies
)
