# Scanpuller

Allows to read scanned files from a ESP32-S3 running a web-server to host files written to via USB (see [here](https://github.com/espressif/esp-iot-solution/tree/master/examples/usb/device/usb_msc_wireless_disk).

For easier deployment, the script is run inside a container.

## Configuration

Most importantly the download folder inside the container (`./download`) has to be mapped to the host folder, on which e.g. paperless reads the documents from.

