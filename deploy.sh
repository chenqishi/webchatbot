#!/bin/bash

# 部署脚本 - 将dist目录内容部署到多个目标目录
# 用法: ./deploy.sh <deploy_path_file>
# deploy_path_file: 包含目标部署目录路径的文件，每行一个路径

set -e  # 遇到错误时退出

# 检查参数
if [ $# -ne 1 ]; then
    echo "用法: $0 <deploy_path_file>"
    echo "deploy_path_file: 包含目标部署目录路径的文件，每行一个路径"
    exit 1
fi

DEPLOY_PATH_FILE="$1"

# 检查部署路径文件是否存在
if [ ! -f "$DEPLOY_PATH_FILE" ]; then
    echo "错误: 部署路径文件 '$DEPLOY_PATH_FILE' 不存在"
    exit 1
fi

# 检查dist目录是否存在
if [ ! -d "dist" ]; then
    echo "错误: dist目录不存在，请先运行 'npm run build'"
    exit 1
fi

# 创建临时目录用于存储要部署的文件
TEMP_DIR=$(mktemp -d)
echo "创建临时目录: $TEMP_DIR"

# 复制dist目录内容到临时目录，排除assets和public目录（保留服务器上的配置文件）
echo "准备部署文件..."

# 读取部署路径文件并部署到每个目录
echo "开始部署到目标目录..."
echo "读取部署路径文件: $DEPLOY_PATH_FILE"
deploy_count=0
error_count=0

# 使用更可靠的while循环读取方式，处理最后一行无换行符的情况
# 临时禁用set -e，避免read命令的退出码影响循环
set +e
while IFS= read -r target_dir || [[ -n "$target_dir" ]]; do
    # 去除行尾的\r字符（处理Windows CRLF换行符）
    target_dir=${target_dir%$'\r'}
    
    # 调试信息：显示读取到的行
    echo "读取到行: '$target_dir'"
    
    # 跳过空行和注释行
    if [[ -z "$target_dir" || "$target_dir" =~ ^[[:space:]]*# ]]; then
        echo "跳过空行或注释行"
        continue
    fi
    
    # 去除行首行尾的空白字符
    target_dir=$(echo "$target_dir" | xargs)
    
    # 检查目标目录是否存在，不存在则创建
    if [ ! -d "$target_dir" ]; then
        echo "创建目录: $target_dir"
        mkdir -p "$target_dir"
    fi
    # 直接复制dist目录内容到目标目录，排除所有包含public的路径
    echo "部署到: $target_dir"
    if rsync -av --exclude='*/assets/*' --exclude='assets/*' dist/ "$target_dir/"; then
        echo "✓ 成功部署到: $target_dir"
        ((deploy_count++))
    else
        echo "✗ 部署失败: $target_dir"
        ((error_count++))
    fi
    
done < "$DEPLOY_PATH_FILE"
# 重新启用set -e
set -e

# 清理临时目录
echo "清理临时目录..."
rm -rf "$TEMP_DIR"

# 输出部署结果
echo ""
echo "部署完成!"
echo "成功部署到 $deploy_count 个目录"
if [ $error_count -gt 0 ]; then
    echo "失败 $error_count 个目录"
    exit 1
fi

echo "所有部署任务完成!"
