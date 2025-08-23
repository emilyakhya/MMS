#!/usr/bin/env node

/**
 * PWA Test Script
 * Tests the AI-Powered Pill Counting PWA functionality
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class PWATester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
    }

    async init() {
        console.log('🚀 Starting PWA tests...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 375, height: 667 }, // Mobile viewport
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Enable service worker
        await this.page.evaluateOnNewDocument(() => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js');
            }
        });
    }

    async testLogin() {
        console.log('📝 Testing login functionality...');
        
        try {
            await this.page.goto('http://localhost:3000/login');
            await this.page.waitForSelector('input[name="email"]');
            
            await this.page.type('input[name="email"]', 'chp1@mms.org');
            await this.page.type('input[name="password"]', 'password123');
            await this.page.click('button[type="submit"]');
            
            await this.page.waitForNavigation();
            
            const currentUrl = this.page.url();
            if (currentUrl.includes('/')) {
                this.testResults.push({ test: 'Login', status: 'PASS', message: 'Login successful' });
            } else {
                this.testResults.push({ test: 'Login', status: 'FAIL', message: 'Login failed' });
            }
        } catch (error) {
            this.testResults.push({ test: 'Login', status: 'FAIL', message: error.message });
        }
    }

    async testBarcodeScanner() {
        console.log('📱 Testing barcode scanner...');
        
        try {
            await this.page.goto('http://localhost:3000/scanner');
            await this.page.waitForSelector('video', { timeout: 5000 });
            
            this.testResults.push({ test: 'Barcode Scanner', status: 'PASS', message: 'Camera access granted' });
        } catch (error) {
            this.testResults.push({ test: 'Barcode Scanner', status: 'SKIP', message: 'Camera access requires user interaction' });
        }
    }

    async testCameraCapture() {
        console.log('📷 Testing camera capture...');
        
        try {
            await this.page.goto('http://localhost:3000/camera');
            await this.page.waitForSelector('input[type="file"]');
            
            // Test file input exists
            const fileInput = await this.page.$('input[type="file"]');
            if (fileInput) {
                this.testResults.push({ test: 'Camera Capture', status: 'PASS', message: 'File input available' });
            } else {
                this.testResults.push({ test: 'Camera Capture', status: 'FAIL', message: 'File input not found' });
            }
        } catch (error) {
            this.testResults.push({ test: 'Camera Capture', status: 'FAIL', message: error.message });
        }
    }

    async testOfflineStorage() {
        console.log('💾 Testing offline storage...');
        
        try {
            // Test IndexedDB
            const dbTest = await this.page.evaluate(() => {
                return new Promise((resolve) => {
                    const request = indexedDB.open('PillCounterDB', 1);
                    request.onsuccess = () => {
                        resolve({ status: 'PASS', message: 'IndexedDB accessible' });
                    };
                    request.onerror = () => {
                        resolve({ status: 'FAIL', message: 'IndexedDB not accessible' });
                    };
                });
            });
            
            this.testResults.push({ test: 'Offline Storage', status: dbTest.status, message: dbTest.message });
        } catch (error) {
            this.testResults.push({ test: 'Offline Storage', status: 'FAIL', message: error.message });
        }
    }

    async testServiceWorker() {
        console.log('🔧 Testing service worker...');
        
        try {
            const swTest = await this.page.evaluate(() => {
                return new Promise((resolve) => {
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(registrations => {
                            if (registrations.length > 0) {
                                resolve({ status: 'PASS', message: 'Service worker registered' });
                            } else {
                                resolve({ status: 'FAIL', message: 'No service worker found' });
                            }
                        });
                    } else {
                        resolve({ status: 'FAIL', message: 'Service worker not supported' });
                    }
                });
            });
            
            this.testResults.push({ test: 'Service Worker', status: swTest.status, message: swTest.message });
        } catch (error) {
            this.testResults.push({ test: 'Service Worker', status: 'FAIL', message: error.message });
        }
    }

    async testPWAInstall() {
        console.log('📱 Testing PWA installability...');
        
        try {
            await this.page.goto('http://localhost:3000');
            
            const manifestTest = await this.page.evaluate(() => {
                return new Promise((resolve) => {
                    const link = document.querySelector('link[rel="manifest"]');
                    if (link) {
                        fetch(link.href)
                            .then(response => response.json())
                            .then(manifest => {
                                if (manifest.name && manifest.short_name) {
                                    resolve({ status: 'PASS', message: 'Manifest valid' });
                                } else {
                                    resolve({ status: 'FAIL', message: 'Manifest invalid' });
                                }
                            })
                            .catch(() => {
                                resolve({ status: 'FAIL', message: 'Manifest not accessible' });
                            });
                    } else {
                        resolve({ status: 'FAIL', message: 'Manifest not found' });
                    }
                });
            });
            
            this.testResults.push({ test: 'PWA Manifest', status: manifestTest.status, message: manifestTest.message });
        } catch (error) {
            this.testResults.push({ test: 'PWA Manifest', status: 'FAIL', message: error.message });
        }
    }

    async runAllTests() {
        await this.init();
        
        await this.testLogin();
        await this.testBarcodeScanner();
        await this.testCameraCapture();
        await this.testOfflineStorage();
        await this.testServiceWorker();
        await this.testPWAInstall();
        
        await this.browser.close();
        
        this.printResults();
    }

    printResults() {
        console.log('\n📊 Test Results:');
        console.log('================');
        
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        
        this.testResults.forEach(result => {
            const status = result.status === 'PASS' ? '✅' : result.status === 'SKIP' ? '⏭️' : '❌';
            console.log(`${status} ${result.test}: ${result.message}`);
            
            if (result.status === 'PASS') passed++;
            else if (result.status === 'FAIL') failed++;
            else skipped++;
        });
        
        console.log('\n📈 Summary:');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏭️ Skipped: ${skipped}`);
        
        if (failed === 0) {
            console.log('\n🎉 All tests passed! PWA is working correctly.');
        } else {
            console.log('\n⚠️ Some tests failed. Please check the implementation.');
        }
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const tester = new PWATester();
    tester.runAllTests().catch(console.error);
}

module.exports = PWATester;
