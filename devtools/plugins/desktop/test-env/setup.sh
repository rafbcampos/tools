#!/bin/sh

# Define a function to log steps
log_step() {
  echo "\033[1;34m==>\033[0m \033[1m$1\033[0m"
}

# Define the root directory of the monorepo
ROOT_DIR=$(git rev-parse --show-toplevel)

# Define the directories
BAZEL_OUT_DIR="$ROOT_DIR/bazel-out/darwin-fastbuild/bin"
TEST_ENV_DIR="$ROOT_DIR/devtools/plugins/desktop/test-env"
BROWSER_DEVTOOLS_DIR="$TEST_ENV_DIR/node_modules/browser-devtools"
DEST_DIR="$HOME/Desktop/browser-devtools"

log_step "Environment checks..."
# Define the required Node.js and pnpm versions
REQUIRED_NODE_VERSION=$(jq -r '.engines.node' "$ROOT_DIR/package.json")
REQUIRED_PNPM_VERSION=$(jq -r '.engines.pnpm' "$ROOT_DIR/package.json")

# Check the current Node.js and pnpm versions
CURRENT_NODE_VERSION=$(node -v)
CURRENT_PNPM_VERSION=$(pnpm -v)

# Install Node.js and pnpm if the versions don't match
if [ "$CURRENT_NODE_VERSION" != "$REQUIRED_NODE_VERSION" ]; then
  log_step "Installing Node.js $REQUIRED_NODE_VERSION..."
  volta install node@"$REQUIRED_NODE_VERSION"
fi

if [ "$CURRENT_PNPM_VERSION" != "$REQUIRED_PNPM_VERSION" ]; then
  log_step "Installing pnpm $REQUIRED_PNPM_VERSION..."
  volta install pnpm@"$REQUIRED_PNPM_VERSION"
fi


# Handle node_modules directories without sudo
# Change the owner of the devtools directory to the current user
log_step "Changing owner of devtools directory to the current user..."
chown -R $(whoami) "$ROOT_DIR/devtools"

# Define the packages to copy
PACKAGES=("client" "messenger" "types")

# Go to the root directory and install dependencies
log_step "Installing root dependencies..."
cd "$ROOT_DIR" && pnpm i

# Build local packages
log_step "Bulding local packages..."
bazel build //...

# Go to the test environment directory and install dependencies
log_step "Installing test-env dependencies..."
cd "$TEST_ENV_DIR" && pnpm i

# Copy the packages
log_step "Copying local dependencies to the browser extension..."
for PACKAGE in "${PACKAGES[@]}"; do
  DEST_PACKAGE_DIR="$BROWSER_DEVTOOLS_DIR/node_modules/@player-tools/devtools-$PACKAGE"
  mkdir -p "$DEST_PACKAGE_DIR"
  cp -r "$BAZEL_OUT_DIR/devtools/$PACKAGE/$PACKAGE/"* "$DEST_PACKAGE_DIR"
done

# Change the owner of the old browser-devtools directory on the Desktop to the current user
if [ -d "$DEST_DIR" ]; then
  log_step "Changing owner of old browser-devtools directory on the Desktop to the current user..."
  chown -R $(whoami) "$DEST_DIR"
fi

# Remove old browser-devtools directory if it exists
if [ -d "$DEST_DIR" ]; then
  log_step "Removing old browser-devtools directory on the Desktop..."
  rm -rf "$DEST_DIR"
fi

# Create a new browser-devtools directory on the Desktop
log_step "Creating new browser-devtools directory on the Desktop..."
mkdir -p "$DEST_DIR"

# Change the owner of the new browser-devtools directory on the Desktop to the current user
log_step "Changing owner of new browser-devtools directory on the Desktop to the current user..."
chown -R $(whoami) "$DEST_DIR"

# Copy the contents of the $BROWSER_DEVTOOLS_DIR to the new browser-devtools directory
log_step "Copying contents of $BROWSER_DEVTOOLS_DIR to new browser-devtools directory on the Desktop..."
cp -r "$BROWSER_DEVTOOLS_DIR"/* "$DEST_DIR"

# Go to the test environment directory and install dependencies
log_step "Installing browser devtools extension dependencies..."
cd "$DEST_DIR" && pnpm i && pnpm i @player-ui/pubsub-plugin dequal

# Run the commands concurrently
log_step "Running commands concurrently..."
concurrently --kill-others "cd $DEST_DIR && pnpm inject:chrome" "cd $TEST_ENV_DIR && pnpm dev"
