document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const controlPanel = document.getElementById('controlPanel');
    const originalImage = document.getElementById('originalImage');
    const compressedImage = document.getElementById('compressedImage');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');

    let currentFile = null;

    // 处理拖放上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#007AFF';
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#DEDEDE';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#DEDEDE';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    });

    // 处理点击上传
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
        }
    });

    // 处理图片压缩
    async function handleImageUpload(file) {
        currentFile = file;
        
        // 显示原图
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage.src = e.target.result;
            originalSize.textContent = formatFileSize(file.size);
        };
        reader.readAsDataURL(file);

        // 显示预览区域和控制面板
        previewContainer.style.display = 'grid';
        controlPanel.style.display = 'block';

        // 进行压缩
        await compressImage(file);
    }

    // 压缩图片函数
    async function compressImage(file) {
        try {
            // 首先检查 imageCompression 是否成功加载
            if (typeof imageCompression === 'undefined') {
                throw new Error('图片压缩库未能成功加载，请刷新页面重试');
            }

            // 检查文件类型
            if (!file.type.startsWith('image/')) {
                throw new Error('请上传图片文件（JPG、PNG等格式）');
            }

            // 检查文件大小
            if (file.size > 50 * 1024 * 1024) {
                throw new Error('文件过大，请上传小于50MB的图片');
            }

            const quality = qualitySlider.value / 100;
            const targetSizeMB = quality * (file.size / (1024 * 1024));
            
            const options = {
                maxSizeMB: targetSizeMB,
                maxWidthOrHeight: quality < 0.5 ? 1280 : 1920,
                quality: quality,
                useWebWorker: true,
                preserveExif: true,
                initialQuality: quality,
                onProgress: (progress) => {
                    console.log('压缩进度：', progress);
                }
            };

            if (file.size > 5 * 1024 * 1024) {
                options.maxSizeMB = options.maxSizeMB * 0.7;
            }

            const compressedFile = await imageCompression(file, options);
            
            if (compressedFile.size > file.size * 0.8) {
                options.quality = quality * 0.8;
                options.maxWidthOrHeight = quality < 0.5 ? 1024 : 1600;
                const secondCompression = await imageCompression(compressedFile, options);
                displayCompressedImage(secondCompression);
            } else {
                displayCompressedImage(compressedFile);
            }
        } catch (error) {
            console.error('压缩失败:', error);
            // 显示更友好的错误信息
            alert(error.message || '图片压缩失败，请检查网络连接后重试');
            
            // 重置界面状态
            previewContainer.style.display = 'none';
            controlPanel.style.display = 'none';
        }
    }

    // 新增显示压缩图片的函数
    function displayCompressedImage(compressedFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            compressedImage.src = e.target.result;
            compressedSize.textContent = formatFileSize(compressedFile.size);
            
            // 显示压缩比率
            const compressionRatio = ((1 - compressedFile.size / currentFile.size) * 100).toFixed(1);
            compressedSize.textContent += ` (压缩率: ${compressionRatio}%)`;
        };
        reader.readAsDataURL(compressedFile);
    }

    // 修改质量滑块的事件处理
    qualitySlider.addEventListener('input', (e) => {
        const value = e.target.value;
        qualityValue.textContent = value + '%';
        
        // 添加防抖，避免频繁压缩
        clearTimeout(qualitySlider.timeout);
        qualitySlider.timeout = setTimeout(() => {
            if (currentFile) {
                compressImage(currentFile);
            }
        }, 300);
    });

    // 下载按钮点击事件
    downloadBtn.addEventListener('click', () => {
        if (compressedImage.src) {
            const link = document.createElement('a');
            link.download = 'compressed_image.' + currentFile.name.split('.').pop();
            link.href = compressedImage.src;
            link.click();
        }
    });

    // 文件大小格式化
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 