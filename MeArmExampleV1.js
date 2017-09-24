
/////////////NEW PART ///////////

// Where the Servos are connected
var servos = {
  shoulder : B15,
  elbow : B14,
  base : B13,
  hand : B10,
};

// Add a variable that the 2 functions below will use
Pin.positions = {};

// A function that will set pulse width modulation up on the servo
Pin.prototype.goto = function(pos) { // -1 .. 1
  Pin.positions[this] = pos;
  console.log(this,pos);
  analogWrite(this, E.clip(0.5*pos+1.5,1,2)*0.05, {freq:50});
};
// This will just move one step in the direction that is given
Pin.prototype.move = function(dir) {
  Pin.positions[this] = E.clip(Pin.positions[this]+dir,-1,1);
  this.goto(Pin.positions[this]);
};

// Is the hand clenched?
var clenched;
// These are the values for how much the servo should move if the hand is clenched or not. The values you need will depend on how you assemble the MeArm
var hand_on = 0.96;
var hand_off = 0.8;

// On initialisation, set the MeArm up to it's default positions
function onInit() {
  servos.shoulder.goto(-0.6);
  servos.elbow.goto(0);
  servos.base.goto(0);
  clenched = false;
  servos.hand.goto(hand_off);
}


/* This is a simple scripted sequence of movements. The base is left alone, but the arm:
 *  * Moves to it's starting position with an open gripper
 *  * Reaches out
 *  * Closes the gripper
 *  * Returns to its original position
 *  * Releases the gripper
 */
function doGrab() {
  servos.shoulder.goto(-0.5);
  servos.elbow.goto(0);
  servos.hand.goto(hand_off);
  setTimeout(function() {
    servos.shoulder.goto(-1);
    servos.elbow.goto(-0.4);
    setTimeout(function() {
      servos.hand.goto(hand_on);
      setTimeout(function() {
        servos.shoulder.goto(-0.5);
        servos.elbow.goto(0);
        setTimeout(function() {
          servos.hand.goto(hand_off);
        }, 800);
      }, 500);
    }, 800);
  }, 800);
}



/* As we're plugging the IR receiver right into 3 GPIO pins,
   we have to set them up to give it the power it needs */
A1.write(1);
A0.write(0);


/* Set up the IR receiver. The codes used here are the codes that I got
from my remote control, so use the codes shown by the 
`print("Unknown "+code)` statement below. */
require("IRReceiver").connect(A5, function(code) {
  switch (code) {
    case "10000010000000000111100100000010111111": onInit(); break; // power
    case "10000010000000000111101100000000111111": doGrab(); break; // menu - start 'grab' sequence
    case "111100000111000001110000000011111": servos.elbow.move(0.1); break; // ch +
    case "111100000111000001101000000101111": servos.elbow.move(-0.1); break; // ch -
    case "10000010000000000111101101100000100111": servos.base.move(-0.1); break; // left
    case "10000010000000000111100101100010100111": servos.base.move(0.1); break; // right
    case "10000010000000000111100001100011100111": servos.shoulder.move(0.1); break; // up
    case "10000010000000000111101001100001100111": servos.shoulder.move(-0.1); break; // down
    case "10000010000000000111100011100011000111": clenched = !clenched; 
                     servos.hand.goto(clenched ? hand_on : hand_off); break; // ok
    default: print("Unknown "+code);
  }
});