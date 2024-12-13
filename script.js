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
            // 根据滑块值动态计算目标文件大小
            const quality = qualitySlider.value / 100;
            const targetSizeMB = quality * (file.size / (1024 * 1024));
            
            const options = {
                // 设置目标压缩大小，根据质量滑块值计算
                maxSizeMB: targetSizeMB,
                // 根据质量值调整最大尺寸
                maxWidthOrHeight: quality < 0.5 ? 1280 : 1920,
                // 使用质量滑块的值
                quality: quality,
                // 启用 webworker 提升性能
                useWebWorker: true,
                // 保持 EXIF 数据
                preserveExif: true,
                // 设置初始压缩程度
                initialQuality: quality,
            };

            // 如果文件大于 5MB，增加额外压缩
            if (file.size > 5 * 1024 * 1024) {
                options.maxSizeMB = options.maxSizeMB * 0.7;
            }

            const compressedFile = await imageCompression(file, options);
            
            // 如果压缩后文件仍然很大，进行第二次压缩
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
            alert('图片压缩失败，请重试');
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