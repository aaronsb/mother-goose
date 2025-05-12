#!/bin/bash
set -e

BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

echo -e "${BOLD}Mother Goose Installer and Validator${RESET}"
echo "======================================"
echo ""

# Check Node.js version
echo -e "${BOLD}Checking Node.js version...${RESET}"
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js is not installed!${RESET}"
  echo "Please install Node.js v16 or higher from https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d '.' -f 1)

if [ "$NODE_MAJOR" -lt 16 ]; then
  echo -e "${RED}❌ Node.js version is too old (v$NODE_VERSION)${RESET}"
  echo "Mother Goose requires Node.js v16 or higher"
  echo "Please upgrade your Node.js installation from https://nodejs.org/"
  exit 1
fi

echo -e "${GREEN}✅ Node.js v$NODE_VERSION is installed${RESET}"
echo ""

# Check if Goose CLI is installed
echo -e "${BOLD}Checking Goose CLI installation...${RESET}"
if ! command -v goose &> /dev/null; then
  echo -e "${RED}❌ Goose CLI is not installed!${RESET}"
  echo "Mother Goose requires Block's Goose CLI to be installed."
  echo ""
  echo "Visit: https://block.xyz/docs/goose for installation instructions"
  echo ""
  
  # Ask if user wants to continue
  read -p "Do you want to continue with Mother Goose installation anyway? (y/N) " CONTINUE
  if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
    echo "Installation aborted."
    exit 1
  fi
  
  echo -e "${YELLOW}⚠️ Continuing without Goose CLI. You'll need to install it later.${RESET}"
else
  GOOSE_VERSION=$(goose --version)
  echo -e "${GREEN}✅ Goose CLI is installed: $GOOSE_VERSION${RESET}"
  
  # Try a quick test
  echo "Testing Goose CLI with a simple query..."
  if timeout 10 goose run --text "test" --max-tokens 1 &> /dev/null; then
    echo -e "${GREEN}✅ Goose CLI is working properly${RESET}"
  else
    echo -e "${YELLOW}⚠️ Goose CLI is installed but may not be configured correctly${RESET}"
    echo "Please ensure your API key is set up and Goose can execute commands."
  fi
fi
echo ""

# Install Mother Goose
echo -e "${BOLD}Installing Mother Goose...${RESET}"
npm install
echo -e "${GREEN}✅ Dependencies installed${RESET}"
echo ""

# Build the project
echo -e "${BOLD}Building Mother Goose...${RESET}"
npm run build
echo -e "${GREEN}✅ Build completed${RESET}"
echo ""

# Show success message
echo -e "${GREEN}${BOLD}✅ Mother Goose installation completed!${RESET}"
echo ""
echo "You can now:"
echo "1. Run 'npm run validate' to verify your setup"
echo "2. Run 'node build/index.js' to start the MCP server"
echo "3. Configure your MCP client to use Mother Goose"
echo ""
echo "For more information, see README.md and QUICK-START.md"
echo ""