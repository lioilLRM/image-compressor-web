// 获取DOM元素
const imageInput = document.getElementById('imageInput');
const originalImage = document.getElementById('originalImage');
const compressedImage = document.getElementById('compressedImage');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const downloadBtn = document.getElementById('downloadBtn');
const previewContainer = document.querySelector('.preview-container');
const uploadArea = document.getElementById('uploadArea');
const dragOverlay = document.getElementById('dragOverlay');
const loadingContainer = document.getElementById('loadingContainer');
const imagesList = document.getElementById('imagesList');
const imagesGrid = document.getElementById('imagesGrid');
const batchQualitySlider = document.getElementById('batchQualitySlider');
const batchQualityValue = document.getElementById('batchQualityValue');
const batchCompressBtn = document.getElementById('batchCompressBtn');
const batchDownloadBtn = document.getElementById('batchDownloadBtn');

// 当前压缩后的图片blob
let compressedBlob = null;

// 存储待处理的图片
let pendingImages = [];

// 监听文件上传 - 修改这里
imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        handleMultipleFiles(files);
    }
});

// 监听质量滑块变化
qualitySlider.addEventListener('input', (e) => {
    qualityValue.textContent = `${e.target.value}%`;
    if (originalImage.src) {
        compressImage(originalImage, e.target.value / 100);
    }
});

// 监听下载按钮
downloadBtn.addEventListener('click', () => {
    if (compressedBlob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(compressedBlob);
        link.download = 'compressed_image.jpg';
        link.click();
    }
});

// 添加拖放相关事件监听
function initializeDragAndDrop() {
    // 阻止默认拖放行为 - 添加 window 的监听
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        window.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    // 处理拖放视觉反馈 - 修改这部分
    let dragCounter = 0;

    uploadArea.addEventListener('dragenter', (e) => {
        dragCounter++;
        if (dragCounter === 1) {
            highlight(e);
        }
    }, false);

    uploadArea.addEventListener('dragleave', (e) => {
        dragCounter--;
        if (dragCounter === 0) {
            unhighlight(e);
        }
    }, false);

    uploadArea.addEventListener('drop', (e) => {
        dragCounter = 0;
        unhighlight(e);
        handleDrop(e);
    }, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
}

function highlight(e) {
    requestAnimationFrame(() => {
        uploadArea.classList.add('drag-over');
        dragOverlay.classList.add('active');
    });
}

function unhighlight(e) {
    requestAnimationFrame(() => {
        uploadArea.classList.remove('drag-over');
        dragOverlay.classList.remove('active');
    });
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const dt = e.dataTransfer;
    const files = [];
    
    if (dt.items) {
        // 使用 DataTransferItemList 接口
        for (let i = 0; i < dt.items.length; i++) {
            if (dt.items[i].kind === 'file') {
                const file = dt.items[i].getAsFile();
                if (file.type.match('image/(jpeg|png|jpg)')) {
                    files.push(file);
                }
            }
        }
    } else {
        // 使用 DataTransfer 接口
        for (let i = 0; i < dt.files.length; i++) {
            if (dt.files[i].type.match('image/(jpeg|png|jpg)')) {
                files.push(dt.files[i]);
            }
        }
    }

    if (files.length > 0) {
        handleMultipleFiles(files);
    } else {
        alert('请上传 JPG 或 PNG 格式的图片！');
    }
}

// 添加显示和隐藏加载动画的函数
function showLoading() {
    loadingContainer.style.display = 'flex';
    requestAnimationFrame(() => {
        loadingContainer.classList.add('show');
    });
}

function hideLoading() {
    loadingContainer.classList.remove('show');
    setTimeout(() => {
        loadingContainer.style.display = 'none';
    }, 300);
}

// 处理图片文件的统一函数
function handleImageFile(file) {
    // 显示加载动画
    showLoading();
    
    // 显示预览区域
    previewContainer.style.display = 'block';
    
    // 显示原始文件大小
    originalSize.textContent = formatFileSize(file.size);
    
    // 创建文件阅读器
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage.src = e.target.result;
        originalImage.onload = () => {
            compressImage(originalImage, qualitySlider.value / 100);
        };
    };
    reader.readAsDataURL(file);
}

// 初始化拖放功能
initializeDragAndDrop();

// 压缩图片
function compressImage(img, quality) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置canvas尺寸为图片原始尺寸
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // 在canvas上绘制图片
    ctx.drawImage(img, 0, 0);
    
    // 将canvas内容转换为blob
    canvas.toBlob(
        (blob) => {
            compressedBlob = blob;
            compressedImage.src = URL.createObjectURL(blob);
            compressedSize.textContent = formatFileSize(blob.size);
            
            // 图片处理完成后隐藏加载动画
            hideLoading();
        },
        'image/jpeg',
        quality
    );
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 处理多个文件
function handleMultipleFiles(files) {
    imagesList.style.display = 'block';
    
    files.forEach(file => {
        // 创建预览
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageItem = createImageItem(file, e.target.result);
            imagesGrid.appendChild(imageItem);
            pendingImages.push({
                file: file,
                element: imageItem,
                compressed: null
            });
        };
        reader.readAsDataURL(file);
    });
}

// 创建图片项
function createImageItem(file, previewUrl) {
    const div = document.createElement('div');
    div.className = 'image-item';
    div.innerHTML = `
        <img src="${previewUrl}" alt="${file.name}">
        <div class="item-info">
            <div>原始大小：${formatFileSize(file.size)}</div>
            <div class="compressed-size"></div>
        </div>
        <div class="compress-progress">
            <div class="progress-bar"></div>
        </div>
        <button class="remove-btn" title="移除">×</button>
        <button class="preview-btn" title="预览对比">👁️</button>
    `;

    // 添加移除按钮事件
    div.querySelector('.remove-btn').addEventListener('click', () => {
        const index = pendingImages.findIndex(item => item.element === div);
        if (index !== -1) {
            pendingImages.splice(index, 1);
            div.remove();
        }
        if (pendingImages.length === 0) {
            imagesList.style.display = 'none';
        }
    });

    // 添加预览按钮事件
    div.querySelector('.preview-btn').addEventListener('click', () => {
        const imageItem = pendingImages.find(item => item.element === div);
        if (imageItem) {
            showPreviewModal(imageItem);
        }
    });

    return div;
}

// 添加预览模态框函数
function showPreviewModal(imageItem) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'preview-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal">×</button>
            <h3>图片压缩对比</h3>
            <div class="comparison-container">
                <div class="comparison-item">
                    <h4>原图</h4>
                    <div class="comparison-image">
                        <img src="${imageItem.element.querySelector('img').src}" alt="原图">
                    </div>
                    <div class="comparison-info">
                        大小：${formatFileSize(imageItem.file.size)}
                    </div>
                </div>
                <div class="comparison-item">
                    <h4>压缩后</h4>
                    <div class="comparison-image">
                        <img src="${imageItem.compressed ? URL.createObjectURL(imageItem.compressed.blob) : ''}" 
                             alt="压缩后" 
                             style="${!imageItem.compressed ? 'display: none;' : ''}">
                        ${!imageItem.compressed ? '<div class="no-compress">尚未压缩</div>' : ''}
                    </div>
                    <div class="comparison-info">
                        ${imageItem.compressed ? '大小：' + formatFileSize(imageItem.compressed.blob.size) : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    // 添加关闭事件
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });

    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);
    
    // 添加动画效果
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

// 批量压缩
batchCompressBtn.addEventListener('click', async () => {
    showLoading();
    const quality = batchQualitySlider.value / 100;
    
    for (let item of pendingImages) {
        if (!item.compressed) {
            const progressBar = item.element.querySelector('.progress-bar');
            progressBar.style.width = '0%';
            
            await compressImageFile(item.file, quality, (progress) => {
                progressBar.style.width = `${progress * 100}%`;
            }).then(result => {
                item.compressed = result;
                const sizeDiv = item.element.querySelector('.compressed-size');
                sizeDiv.textContent = `压缩后：${formatFileSize(result.blob.size)}`;
            });
        }
    }
    
    hideLoading();
});

// 批量下载
batchDownloadBtn.addEventListener('click', () => {
    pendingImages.forEach((item, index) => {
        if (item.compressed) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(item.compressed.blob);
            link.download = `compressed_${index + 1}.jpg`;
            link.click();
        }
    });
});

// 压缩单个图片文件
async function compressImageFile(file, quality, progressCallback) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            ctx.drawImage(img, 0, 0);
            
            if (progressCallback) {
                progressCallback(0.5); // 50% progress after drawing
            }
            
            canvas.toBlob(
                (blob) => {
                    if (progressCallback) {
                        progressCallback(1); // 100% progress after compression
                    }
                    resolve({
                        blob,
                        width: img.naturalWidth,
                        height: img.naturalHeight
                    });
                },
                'image/jpeg',
                quality
            );
        };
        
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// 监听批量压缩质量滑块
batchQualitySlider.addEventListener('input', (e) => {
    batchQualityValue.textContent = `${e.target.value}%`;
}); 