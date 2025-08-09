
```
    ███        ▄████████   ▄▄▄▄███▄▄▄▄      ▄███████▄  ▄█          ▄████████     ███        ▄████████ 
▀█████████▄   ███    ███ ▄██▀▀▀███▀▀▀██▄   ███    ███ ███         ███    ███ ▀█████████▄   ███    ███ 
   ▀███▀▀██   ███    █▀  ███   ███   ███   ███    ███ ███         ███    ███    ▀███▀▀██   ███    █▀  
    ███   ▀  ▄███▄▄▄     ███   ███   ███   ███    ███ ███         ███    ███     ███   ▀  ▄███▄▄▄     
    ███     ▀▀███▀▀▀     ███   ███   ███ ▀█████████▀  ███       ▀███████████     ███     ▀▀███▀▀▀     
    ███       ███    █▄  ███   ███   ███   ███        ███         ███    ███     ███       ███    █▄  
    ███       ███    ███ ███   ███   ███   ███        ███▌    ▄   ███    ███     ███       ███    ███ 
   ▄████▀     ██████████  ▀█   ███   █▀   ▄████▀      █████▄▄██   ███    █▀     ▄████▀     ██████████ 
                                                      ▀                                               
```

Source for ASCII-fonts: https://www.coolgenerator.com/ascii-text-generator
(Font: Delta Corps Priest 1


# What is this?

This is template for TypeScript project in VS Code with linting.

# What's the motivation?

To have an easier start for my projects.

# Setup

## Prerequisites
You will need "node.js" and "pnpm" installed on your system to use this
template.
To install node.js I recommend using nvm (Node Version Manager).
See https://github.com/nvm-sh/nvm for installation instructions.

### NVM (Node Version Manager)
Description from `tldr nvm` output:

Install, uninstall or switch between Node.js versions.
Supports version numbers like "12.8" or "v16.13.1", and labels like "stable", "system", etc.
More information: <https://github.com/creationix/nvm>.

- Install a specific version of Node.js:
    `nvm install node_version`

- Use a specific version of Node.js in the current shell:
    `nvm use node_version`

- Set the default Node.js version:
    `nvm alias default node_version`

- List all available Node.js versions and highlight the default one:
    `nvm list`

### pnpm
"pnpm" is my personal choice for a faster alternative to "npm" and "yarn".
Install pnpm with `npm i -g pnpm`.
The general usage is the same as with "npm".

## Usage of this project template
For local development start with `pnpm i` to install all dependencies.
For Visual Studio Code (VSC) there is a workspace configuration file included.
There are npm/pnpm scripts availble to run from CLI or VSC.
- `pnpm run build` to compile the project.
- `pnpm run test_core` to run core unit tests w/o dependencies.
- `pnpm run test_all` to run the all tests (including integration).
- `pnpm run start "test argument"` to run an example.

Launch configs of VS Code can be found in `.vscode/launch.json`.

## Docker Setup
To build a docker image use 
```bash
docker buildx build -t jni-ts-template . 
```
or run `pnpm run build-docker-image`.

To run a temporary container from the image call: 
```bash
docker container run --rm jni-ts-template "test arg value"
```
or call `pnpm run run-container`.

Change the image name (here `jni-ts-template`) to your liking.

### Optional: Add an alias to run the docker container as an CLI tool
```shell
alias yourcommand='docker container run --rm jni-ts-template'
```

## Setting env variables (optional)
Place keys and environment variable values inside a .env file in the project's root folder. The `.env` fils is included in `.gitignore`.

```
TEST_VAR = "Test value"
```

# Update all packages to the latest version
`pnpm update --latest` to update all packages to the latest version.

# Add a package to the project
`pnpm add -D <package>` to add a package to the project. The `-D` flag is for development dependencies.

# How to use
<< Insert your description here. >>

# Release History

## v2.1.0
- Integrate Theo's trycatch

## v2.0.0 from 2025-02-22
- Update of Typescript settings
- Update of ES Linting including new config file
- Update of all libraries to current version
- Introduction of core unit tests and integration tests
- Example for integration tests w/ testcontainers and a neo4j DB
- Docker image build includes core unit tests and only depends on itself
- Update of shared types and functions
- Update of the README file

## v1.2.2 
- Better documentation and misusage.

## v1.2.1
- Fixing missing env variable in docker image.
- Add /logs to .gitignore.

## v1.2.0
- Merge in enums, sharedFunction, logger.
- Introduce winston.

## v1.1.1
- Updated to latest libraries.

## v1.1.0
- Even tougher linting rules.
- Multi stage docker build with Node 18 (for Rapsberry PI compatibility).


## v1.0.0
- TypeScript 5.3
- All packages updated to latest version.
- Tougher linting rules.

## v0.7.0
- Update packages (TS to 5.1)
- Update Docker image to use Node 20.
- Add optional package with test.
- Add tests for diverse useful use cases (e.g., using workers w/ multi cores).
- Remove obsolete greeter code.

## v0.6.0
- Add docker image creation (e.g. for an encapsulated CLI rool).
- Add helpers for reading the version, parsing .env file and user arguments.

## v0.5.1
- Remove not used workspace configuration.

## v0.5.0
- Upgrade all components to latest versions.
- Use 'NodeNext' for module resolution.
- Replace 'npm' with 'pnpm'.
- Replace 'jest' with 'mocha'.

## v0.4.1
- Template restrictions removed in linting.

## v0.4.0
- NCU guide added to readme.
- Upgraded to latest versions of TypeScript (4.5.2), Jest (27.4.3) and the rest.

## v0.3.0
- Upgrade of TypeScript to 4.3

## v0.2.0
- Support for dotenv

## v0.1.0
- Initial commit.
