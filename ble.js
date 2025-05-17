
let connectedDevices = {};

async function scanPhotocells() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'CRONOPIC-F' }],
      optionalServices: [0xFFE0]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(0xFFE0);
    const characteristic = await service.getCharacteristic(0xFFE1);

    connectedDevices[device.name] = { device, characteristic };

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const value = new TextDecoder().decode(event.target.value);
      if (/^r[1-9]$/.test(value)) {
        document.dispatchEvent(new CustomEvent("photocellTrigger", { detail: { sensor: value, name: device.name } }));
      }
    });

    alert("Conectado a " + device.name);
  } catch (e) {
    alert("Error al conectar: " + e.message);
  }
}
