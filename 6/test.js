// Test script for Enigma machine
const assert = require("assert");
const { Enigma, Rotor, plugboardSwap, alphabet } = require("./enigma.js");

// Test functions
function runTests() {
  console.log("Running Enigma Machine Tests...\n");

  let testsPassed = 0;
  let totalTests = 0;

  // Test basic reciprocity
  console.log("1. Testing basic encryption/decryption reciprocity...");
  totalTests++;
  try {
    const enigma1 = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
    const enigma2 = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);

    const plaintext = "HELLO";
    const encrypted = enigma1.process(plaintext);
    const decrypted = enigma2.process(encrypted);

    assert.strictEqual(decrypted, plaintext, "Basic reciprocity failed");
    console.log(`   ✓ ${plaintext} -> ${encrypted} -> ${decrypted}`);
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
  }

  // Test plugboard functionality
  console.log("2. Testing plugboard functionality...");
  totalTests++;
  try {
    const enigma1 = new Enigma(
      [0, 1, 2],
      [0, 0, 0],
      [0, 0, 0],
      [
        ["A", "B"],
        ["C", "D"],
      ]
    );
    const enigma2 = new Enigma(
      [0, 1, 2],
      [0, 0, 0],
      [0, 0, 0],
      [
        ["A", "B"],
        ["C", "D"],
      ]
    );

    const plaintext = "ABCD";
    const encrypted = enigma1.process(plaintext);
    const decrypted = enigma2.process(encrypted);

    assert.strictEqual(decrypted, plaintext, "Plugboard reciprocity failed");
    console.log(
      `   ✓ With plugboard: ${plaintext} -> ${encrypted} -> ${decrypted}`
    );
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
  }

  // Test rotor stepping
  console.log("3. Testing rotor stepping...");
  totalTests++;
  try {
    const enigma = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);

    // Initial positions should be [0, 0, 0]
    assert.strictEqual(enigma.rotors[0].position, 0);
    assert.strictEqual(enigma.rotors[1].position, 0);
    assert.strictEqual(enigma.rotors[2].position, 0);

    // After one character, only rightmost should step
    enigma.encryptChar("A");
    assert.strictEqual(enigma.rotors[0].position, 0);
    assert.strictEqual(enigma.rotors[1].position, 0);
    assert.strictEqual(enigma.rotors[2].position, 1);

    console.log("   ✓ Rotor stepping works correctly");
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
  }

  // Test complex settings
  console.log("4. Testing complex settings...");
  totalTests++;
  try {
    const settings = {
      rotorIDs: [0, 1, 2],
      rotorPositions: [5, 10, 15],
      ringSettings: [2, 4, 6],
      plugboardPairs: [
        ["A", "M"],
        ["B", "N"],
        ["C", "O"],
      ],
    };

    const enigma1 = new Enigma(
      settings.rotorIDs,
      settings.rotorPositions,
      settings.ringSettings,
      settings.plugboardPairs
    );

    const enigma2 = new Enigma(
      settings.rotorIDs,
      settings.rotorPositions,
      settings.ringSettings,
      settings.plugboardPairs
    );

    const plaintext = "THEQUICKBROWNFOX";
    const encrypted = enigma1.process(plaintext);
    const decrypted = enigma2.process(encrypted);

    assert.strictEqual(
      decrypted,
      plaintext,
      "Complex settings reciprocity failed"
    );
    console.log(
      `   ✓ Complex: ${plaintext.substring(0, 8)}... -> ${encrypted.substring(
        0,
        8
      )}... -> ${decrypted.substring(0, 8)}...`
    );
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
  }

  // Test non-alphabetic characters
  console.log("5. Testing non-alphabetic characters...");
  totalTests++;
  try {
    const enigma = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
    const input = "HELLO, WORLD! 123";
    const output = enigma.process(input);

    assert.strictEqual(output.includes(","), true);
    assert.strictEqual(output.includes("!"), true);
    assert.strictEqual(output.includes(" "), true);
    assert.strictEqual(output.includes("1"), true);

    console.log("   ✓ Non-alphabetic characters pass through unchanged");
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
  }

  // Test that shows the bug was fixed
  console.log("6. Testing bug fix - demonstrating the issue was resolved...");
  totalTests++;
  try {
    // Create two machines with plugboard settings
    const machine1 = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], [["A", "B"]]);
    const machine2 = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], [["A", "B"]]);

    // Test that A gets properly swapped twice (input and output)
    const result1 = machine1.process("A");
    const result2 = machine2.process(result1);

    assert.strictEqual(result2, "A", "Plugboard double-swap bug not fixed");
    console.log(
      `   ✓ Bug fix verified: A -> ${result1} -> A (plugboard works both ways)`
    );
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
  }

  // Test plugboard swap function directly
  console.log("7. Testing plugboard swap function directly...");
  totalTests++;
  try {
    // Test basic swap
    assert.strictEqual(plugboardSwap("A", [["A", "B"]]), "B");
    assert.strictEqual(plugboardSwap("B", [["A", "B"]]), "A");

    // Test no swap
    assert.strictEqual(plugboardSwap("C", [["A", "B"]]), "C");

    // Test multiple pairs
    assert.strictEqual(
      plugboardSwap("A", [
        ["A", "B"],
        ["C", "D"],
      ]),
      "B"
    );
    assert.strictEqual(
      plugboardSwap("D", [
        ["A", "B"],
        ["C", "D"],
      ]),
      "C"
    );

    console.log("   ✓ Plugboard swap function works correctly");
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
  }

  // Test rotor basics
  console.log("8. Testing rotor basics...");
  totalTests++;
  try {
    const rotor = new Rotor("EKMFLGDQVZNTOWYHXUSPAIBRCJ", "Q", 0, 0);

    // Test forward encryption
    assert.strictEqual(rotor.forward("A"), "E");

    // Test backward encryption (should be inverse)
    assert.strictEqual(rotor.backward("E"), "A");

    // Test stepping
    rotor.step();
    assert.strictEqual(rotor.position, 1);

    // Test notch detection
    rotor.position = 16; // Q is at position 16
    assert.strictEqual(rotor.atNotch(), true);

    console.log("   ✓ Rotor basic functionality works correctly");
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
  }

  console.log(`\nTest Results: ${testsPassed}/${totalTests} tests passed`);
  console.log(
    `Test Coverage: ${Math.round((testsPassed / totalTests) * 100)}%`
  );

  if (testsPassed === totalTests) {
    console.log(
      "🎉 All tests passed! The Enigma machine is working correctly."
    );
  } else {
    console.log("❌ Some tests failed. Please review the implementation.");
  }

  return testsPassed === totalTests;
}

if (require.main === module) {
  runTests();
}
