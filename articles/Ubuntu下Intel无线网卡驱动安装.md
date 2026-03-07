#计算机  #Linux

首先查看网卡型号，指令：

```shell
lspci | grep -i net
```

# 下载前，需要先确定系统内核版本

```shell
cat /proc/version
```

如果内核版本低于所要求的最低版本，需要升级系统内核。

```shell
sudo apt-get install linux-generic-lts-wily
```

# 下载驱动并解压

```shell
cp iwlwifi-*.ucode /lib/firmware
```

重启，无线网卡驱动安装成功。
