port=$(ls /dev | grep tty.usb)

./ampy.py -p /dev/$port put ../sender.py main.py
./ampy.py -p /dev/$port put ../sx127x.py sx127x.py
./ampy.py -p /dev/$port put ../lora.py lora.py
./ampy.py -p /dev/$port put ../config.py config.py
