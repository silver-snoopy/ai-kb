// Stub HTMLCanvasElement.getContext so Phaser's CanvasFeatures boot-time probe
// does not throw under jsdom (jsdom returns null for getContext('2d')).
// Tests do not exercise rendering; they only import Phaser for types and
// Phaser.Events.EventEmitter.
if (typeof HTMLCanvasElement !== 'undefined') {
  const noop = () => {};
  const stub2d = {
    fillStyle: '',
    globalCompositeOperation: '',
    fillRect: noop,
    drawImage: noop,
    getImageData: () => ({ data: new Uint8ClampedArray([0, 0, 0, 0]) }),
    putImageData: noop,
  };
  // @ts-ignore override for test environment
  HTMLCanvasElement.prototype.getContext = function () { return stub2d as any; };
}
