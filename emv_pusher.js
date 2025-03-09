// ==UserScript==
// @name         EMV Pusher
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  EMV Pusher
// @updateURL    https://dannynguyen2704.github.io/emv_pusher.js
// @downloadURL  https://dannynguyen2704.github.io/emv_pusher.js
// @author       Danny
// @match        *://www.instagram.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const tag =
`@panly.v @ysl
#YSL
#SaintLaurentxMilk
#YvesSaintLaurent
#SaintLaurent
#MilkPansa
#ParisFashionWeek
#PFW25
`

    function createUI() {
        let container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.right = '10px';
        container.style.background = 'white';
        container.style.padding = '10px';
        container.style.border = '1px solid black';
        container.style.zIndex = '10000';

        let uploadButton = document.createElement('input');
        uploadButton.type = 'file';
        uploadButton.accept = '.txt';

        let runButton = document.createElement('button');
        runButton.textContent = 'Run';

        let progressText = document.createElement('span');
        progressText.id = 'progressText';
        progressText.textContent = 'Progress: 0/0  0%';
        progressText.style.display = 'block';
        progressText.style.marginTop = '10px';

        container.appendChild(uploadButton);
        container.appendChild(runButton);
        container.appendChild(progressText);
        document.body.appendChild(container);

        uploadButton.addEventListener('change', function(event) {
            let file = event.target.files[0];
            if (file) {
                let reader = new FileReader();
                reader.onload = function(e) {
                    let lines = e.target.result.split('\n').map(line => line.trim()).filter(line => line);
                    localStorage.setItem('autoPostData', JSON.stringify(lines));
                    localStorage.setItem('autoPostIndex', '0');
                    updateProgress(0, lines.length);
                    console.log('Data saved!');
                };
                reader.readAsText(file);
            }
        });

        runButton.addEventListener('click', function() {
            let storedData = JSON.parse(localStorage.getItem('autoPostData') || '[]');
            if (storedData.length === 0) {
                console.log('Empty content!');
                return;
            }
            postNext(storedData, 0);
        });
    }

    function updateProgress(index, total) {
        let progressText = document.getElementById('progressText');
        let percent = total > 0 ? ((index / total) * 100).toFixed(2) : 0;
        let progressBar = '-'.repeat(Math.round(percent / 5));
        progressText.textContent = `Progress: ${index}/${total} ${progressBar} ${percent}%`;
    }

    function postNext(data, index) {
        if (index >= data.length) {
            console.log('All posts sent!');
            return;
        }

        let textarea = document.querySelector('textarea');
        if (textarea) {
            textarea.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            textarea.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);

            let j = 0;

            function typeCharacter() {
                let content = data[index];
                if (j < content.length) {
                    let char = content[j];
                    let eventOptions = { key: char, keyCode: char.charCodeAt(0), which: char.charCodeAt(0), bubbles: true };

                    textarea.dispatchEvent(new KeyboardEvent('keydown', eventOptions));
                    document.execCommand('insertText', false, char);
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
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
                                setTimeout(() => postNext(data, index + 1), 5000 + Math.random() * 30000); // Dãn cách 5-30s

                            }
                        });
                    }, 1000);
                }
            }

            typeCharacter();
        }
    }

    function waitForPageLoad(callback) {
        let checkInterval = setInterval(() => {
            if (document.readyState === "complete") {
                clearInterval(checkInterval);
                callback();
            }
        }, 500);
    }

    waitForPageLoad(() => {
        createUI();
    });
})();
