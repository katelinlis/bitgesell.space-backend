#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
echo "[Unit]
    Description=Loto
    Requires=docker.service
    After=docker.service

    [Service]
    WorkingDirectory=${SCRIPT_DIR}
    ExecStart=/bin/docker compose  up
    ExecStop=/bin/docker compose  down
    Restart=always
    RestartSec=10

    [Install]
    WantedBy=default.target
"> /etc/systemd/system/lotto.service

echo "[Unit]
Description=Bitgesell daemon
After=network.target

[Service]
Type=simple
User=root
ExecStart=BGLd
Restart=on-failure
RestartSec=5
TimeoutStopSec=180
KillSignal=SIGTERM

[Install]
WantedBy=multi-user.target
"> /etc/systemd/system/bgld.service


echo "Service build and moved"
sudo systemctl daemon-reload
echo "Service enabled for start at boot"
sudo systemctl start lotto.service
sudo systemctl start bgld.service
sudo systemctl enable lotto.service
sudo systemctl enable bgld.service
echo "Service started"



