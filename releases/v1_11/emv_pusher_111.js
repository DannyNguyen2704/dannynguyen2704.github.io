// ==UserScript==
// @name         EMV Pusher
// @namespace    http://tampermonkey.net/
// @version      1.11
// @description  EMV Pusher
// @updateURL    https://dannynguyen2704.github.io/releases/v1_11/emv_pusher_111.js
// @downloadURL  https://dannynguyen2704.github.io/releases/v1_11/emv_pusher_111.js
// @author       Danny
// @match        *://www.instagram.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function createUI() {
        let container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.right = '10px';
        container.style.background = 'white';
        container.style.padding = '10px';
        container.style.border = '1px solid #ccc';
        container.style.borderRadius = '8px';
        container.style.boxShadow = '0px 4px 8px rgba(0, 0, 0, 0.1)';
        container.style.zIndex = '10000';
        container.style.width = '260px';
        container.style.transition = 'width 0.3s ease, opacity 0.3s ease';
        let toggleButton = document.createElement('button');
        toggleButton.innerHTML = '▼';
        toggleButton.style.display = 'block';
        toggleButton.style.width = '30px';
        toggleButton.style.height = '30px';
        toggleButton.style.background = '#007bff';
        toggleButton.style.color = 'white';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '50%';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.fontSize = '16px';
        toggleButton.style.marginBottom = '5px';

        let contentDiv = document.createElement('div');
        contentDiv.style.display = 'block';
        contentDiv.style.opacity = '1';
        contentDiv.style.transition = 'opacity 0.3s ease';

        let uploadButton = document.createElement('input');
        uploadButton.type = 'file';
        uploadButton.accept = '.txt';
        uploadButton.style.display = 'block';
        uploadButton.style.marginBottom = '10px';

        let runButton = document.createElement('button');
        runButton.textContent = 'Run';

        let intervalContainer = document.createElement('div');
        intervalContainer.style.display = 'flex';
        intervalContainer.style.alignItems = 'center';
        intervalContainer.style.marginTop = '10px';

        let intervalLabel = document.createElement('label');
        intervalLabel.textContent = '⏳ Interval (s): ';
        intervalLabel.style.marginRight = '5px';

        let intervalSlider = document.createElement('input');
        intervalSlider.type = 'range';
        intervalSlider.min = '1';
        intervalSlider.max = '180';
        intervalSlider.value = localStorage.getItem('postInterval') || '3';
        intervalSlider.style.width = '60px';
        intervalSlider.style.margin = '0 5px';

        let intervalValue = document.createElement('span');
        intervalValue.textContent = intervalSlider.value + 's';
        intervalValue.style.fontWeight = 'bold';

        intervalSlider.addEventListener('input', function () {
            intervalValue.textContent = intervalSlider.value + 's';
            localStorage.setItem('postInterval', intervalSlider.value);
        });

        intervalContainer.appendChild(intervalLabel);
        intervalContainer.appendChild(intervalSlider);
        intervalContainer.appendChild(intervalValue);

        let progressContainer = document.createElement('div');
        progressContainer.style.width = '100%';
        progressContainer.style.background = '#eee';
        progressContainer.style.borderRadius = '5px';
        progressContainer.style.marginTop = '10px';
        progressContainer.style.overflow = 'hidden';

        let progressBar = document.createElement('div');
        progressBar.id = 'progressBar';
        progressBar.style.width = '0%';
        progressBar.style.height = '12px';
        progressBar.style.background = '#007bff';
        progressBar.style.transition = 'width 0.5s ease-in-out';

        progressContainer.appendChild(progressBar);

        contentDiv.appendChild(uploadButton);
        contentDiv.appendChild(runButton);
        contentDiv.appendChild(intervalContainer);
        contentDiv.appendChild(progressContainer);

        container.appendChild(toggleButton);
        container.appendChild(contentDiv);
        document.body.appendChild(container);

        toggleButton.addEventListener('click', function () {
            if (contentDiv.style.display === 'none') {
                contentDiv.style.display = 'block';
                contentDiv.style.opacity = '1';
                container.style.width = '260px';
                toggleButton.innerHTML = '▼';
            } else {
                contentDiv.style.opacity = '0';
                setTimeout(() => contentDiv.style.display = 'none', 300);
                container.style.width = '40px';
                toggleButton.innerHTML = '▶';
            }
        });

        uploadButton.addEventListener('change', function (event) {
            let file = event.target.files[0];
            if (file) {
                let reader = new FileReader();
                reader.onload = function (e) {
                    let lines = e.target.result.split('\n').map(line => line.trim()).filter(line => line);
                    localStorage.setItem('autoPostData', JSON.stringify(lines));
                    localStorage.setItem('autoPostIndex', '0');
                    updateProgress(0, lines.length);
                    console.log('Data saved!');
                };
                reader.readAsText(file);
            }
        });

        runButton.addEventListener('click', function () {
            let storedData = JSON.parse(localStorage.getItem('autoPostData') || '[]');
            let currentIndex = parseInt(localStorage.getItem('autoPostIndex') || '0');
            let interval = parseInt(intervalSlider.value) || 3;
            localStorage.setItem('postInterval', interval);

            if (storedData.length === 0) {
                console.log('Empty content!');
                return;
            }
            postNext(storedData, currentIndex, interval);
        });
    }

    function updateProgress(index, total) {
        let progressBar = document.getElementById('progressBar');
        let percent = total > 0 ? ((index / total) * 100).toFixed(2) : 0;
        progressBar.style.width = percent + '%';
    }

    function waitForPageLoad(callback) {
        let checkInterval = setInterval(() => {
            if (document.readyState === "complete") {
                clearInterval(checkInterval);
                callback();
            }
        }, 500);
    }

    function postNext(data, index, interval) {
        if (index >= data.length) {
            console.log('All posts sent!');
            return;
        }

        let textarea = document.querySelector('textarea');
        if (textarea) {
            textarea.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
            textarea.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}));
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);

            let j = 0;

            function typeCharacter() {
                let content = data[index];
                if (j < content.length) {
                    let char = content[j];
                    let eventOptions = {
                        key: char,
                        keyCode: char.charCodeAt(0),
                        which: char.charCodeAt(0),
                        bubbles: true
                    };

                    textarea.dispatchEvent(new KeyboardEvent('keydown', eventOptions));
                    document.execCommand('insertText', false, char);
                    textarea.dispatchEvent(new Event('input', {bubbles: true}));
                    textarea.dispatchEvent(new KeyboardEvent('keyup', eventOptions));

                    j++;
                    setTimeout(typeCharacter, 100);
                } else {
                    setTimeout(() => {
                        let buttons = document.querySelectorAll('div[role="button"]');
                        buttons.forEach(button => {
                            if (button.textContent.trim() === "Post" || button.textContent.trim() === "Đăng") {
                                console.log('Will post soon...');
                                button.click();
                                localStorage.setItem('autoPostIndex', index + 1);
                                updateProgress(index + 1, data.length);
                                let delay = interval * 1000 + Math.random() * 2000;
                                setTimeout(() => postNext(data, index + 1, interval), delay); // Dãn cách theo cấu hình

                            }
                        });
                    }, 1000);
                }
            }

            typeCharacter();
        }
    }

    waitForPageLoad(() => {
        createUI();
    });
})();
