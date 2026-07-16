# China map data

`china.json` is sourced from the Alibaba Cloud DataV administrative boundary API:

https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json

The uncompressed GeoJSON avoids rendering gaps caused by the legacy ECharts
UTF8-encoded map format. Full province names are matched to normalized business
data keys at runtime.
