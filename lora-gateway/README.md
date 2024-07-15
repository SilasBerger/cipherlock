# LoRa Gateway: Range Tester
Add a file `secrets.py` to this directory, with the following contents:

```python
network_ssid = ''  # Your WiFi SSID
network_key = ''  # Your WiFi key
server_url = ''  # The base URL of your lora-range-tester deployment (see https://github.com/SilasBerger/lora-range-tester)
```

Then, plug in your sender device and run `deploy_sender.sh` from the `deployment` directory. Repeat for the receiver and `deploy_receiver.sh`.
