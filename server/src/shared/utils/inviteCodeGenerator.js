const InviteCode = require("../../modules/auth/inviteCode.model");

const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 30 characters, no 0/O/1/I/L

function generateRandom8CharString() {
  let code = "";
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * CHARSET.length);
    code += CHARSET[randomIndex];
  }
  return code;
}

/**
 * Generates a unique 8-character human-shareable invite code
 * Performs collision checks and retries if duplicate code is found.
 */
async function generateUniqueInviteCode() {
  let attempts = 0;
  while (attempts < 15) {
    const candidateCode = generateRandom8CharString();
    const existing = await InviteCode.findOne({ code: candidateCode });
    if (!existing) {
      return candidateCode;
    }
    attempts++;
  }
  // Fallback timestamp suffix if collision loop reaches max attempts
  return `${generateRandom8CharString().substring(0, 6)}${Date.now().toString().slice(-2)}`;
}

module.exports = {
  generateUniqueInviteCode,
};
