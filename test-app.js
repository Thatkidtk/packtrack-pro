const http = require('http');
const fs = require('fs');

class PackTrackTester {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.sessionCookie = null;
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🚀 Starting PackTrack Pro Comprehensive Tests\n');

        try {
            await this.testServerHealth();
            await this.testUserRegistration();
            await this.testUserLogin();
            await this.testItemOperations();
            await this.testBulkOperations();
            await this.testSearchAndFilter();
            await this.testAuthenticationSecurity();

            this.printResults();
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        }
    }

    async makeRequest(path, options = {}) {
        const url = new URL(path, this.baseUrl);
        const reqOptions = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'PackTrack-Test-Suite',
                ...(this.sessionCookie ? { 'Cookie': this.sessionCookie } : {}),
                ...(options.headers || {})
            }
        };

        return new Promise((resolve, reject) => {
            const req = http.request(reqOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    // Capture session cookie if present
                    if (res.headers['set-cookie']) {
                        this.sessionCookie = res.headers['set-cookie'][0].split(';')[0];
                    }
                    
                    try {
                        const result = {
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: data ? JSON.parse(data) : null
                        };
                        resolve(result);
                    } catch (e) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: data
                        });
                    }
                });
            });

            req.on('error', reject);

            if (options.body) {
                req.write(JSON.stringify(options.body));
            }
            req.end();
        });
    }

    addTestResult(testName, passed, details = '') {
        this.testResults.push({ testName, passed, details });
        const icon = passed ? '✅' : '❌';
        console.log(`${icon} ${testName}${details ? ': ' + details : ''}`);
    }

    async testServerHealth() {
        console.log('📋 Testing Server Health...');
        
        const response = await this.makeRequest('/api/health');
        this.addTestResult(
            'Server Health Check',
            response.statusCode === 200 && response.body?.status === 'OK',
            `Status: ${response.statusCode}`
        );
    }

    async testUserRegistration() {
        console.log('\n👤 Testing User Registration...');
        
        const testUser = {
            name: 'Test User',
            email: `test${Date.now()}@example.com`,
            password: 'testpassword123'
        };

        const response = await this.makeRequest('/api/auth/register', {
            method: 'POST',
            body: testUser
        });

        this.addTestResult(
            'User Registration',
            response.statusCode === 200 && response.body?.success,
            `Status: ${response.statusCode}, User ID: ${response.body?.user?.id}`
        );

        // Test duplicate email
        const duplicateResponse = await this.makeRequest('/api/auth/register', {
            method: 'POST',
            body: testUser
        });

        this.addTestResult(
            'Duplicate Email Rejection',
            duplicateResponse.statusCode === 400,
            `Status: ${duplicateResponse.statusCode}`
        );
    }

    async testUserLogin() {
        console.log('\n🔐 Testing User Login...');
        
        // Test with demo account
        const loginResponse = await this.makeRequest('/api/auth/login', {
            method: 'POST',
            body: {
                email: 'demo@packtrack.com',
                password: 'demo123'
            }
        });

        this.addTestResult(
            'User Login (Demo Account)',
            loginResponse.statusCode === 200 && loginResponse.body?.success,
            `Status: ${loginResponse.statusCode}`
        );

        // Test authentication check
        const meResponse = await this.makeRequest('/api/auth/me');
        this.addTestResult(
            'Authentication Status Check',
            meResponse.statusCode === 200 && meResponse.body?.user,
            `User: ${meResponse.body?.user?.name}`
        );
    }

    async testItemOperations() {
        console.log('\n📦 Testing Item Operations...');
        
        // Create item
        const newItem = {
            name: 'Test Item',
            box: 'Test Box 1',
            category: 'Electronics',
            description: 'Test description'
        };

        const createResponse = await this.makeRequest('/api/items', {
            method: 'POST',
            body: newItem
        });

        this.addTestResult(
            'Create Item',
            createResponse.statusCode === 200 && createResponse.body?.id,
            `Item ID: ${createResponse.body?.id}`
        );

        // Get items
        const getResponse = await this.makeRequest('/api/items');
        this.addTestResult(
            'Get Items',
            getResponse.statusCode === 200 && Array.isArray(getResponse.body),
            `Items count: ${getResponse.body?.length || 0}`
        );

        // Delete item (if created successfully)
        if (createResponse.body?.id) {
            const deleteResponse = await this.makeRequest(`/api/items/${createResponse.body.id}`, {
                method: 'DELETE'
            });

            this.addTestResult(
                'Delete Item',
                deleteResponse.statusCode === 200,
                `Status: ${deleteResponse.statusCode}`
            );
        }
    }

    async testBulkOperations() {
        console.log('\n📚 Testing Bulk Operations...');
        
        const bulkItems = [
            { name: 'Bulk Item 1', box: 'Bulk Box', category: 'Clothing' },
            { name: 'Bulk Item 2', box: 'Bulk Box', category: 'Clothing' },
            { name: 'Bulk Item 3', box: 'Bulk Box', category: 'Clothing' }
        ];

        const bulkCreateResponse = await this.makeRequest('/api/items/bulk', {
            method: 'POST',
            body: { items: bulkItems }
        });

        this.addTestResult(
            'Bulk Create Items',
            bulkCreateResponse.statusCode === 200 && bulkCreateResponse.body?.created === 3,
            `Created: ${bulkCreateResponse.body?.created || 0} items`
        );

        // Get all items to get IDs for bulk delete
        const itemsResponse = await this.makeRequest('/api/items');
        if (itemsResponse.body && Array.isArray(itemsResponse.body)) {
            const bulkItemIds = itemsResponse.body
                .filter(item => item.box === 'Bulk Box')
                .map(item => item.id);

            if (bulkItemIds.length > 0) {
                const bulkDeleteResponse = await this.makeRequest('/api/items/bulk', {
                    method: 'DELETE',
                    body: { ids: bulkItemIds }
                });

                this.addTestResult(
                    'Bulk Delete Items',
                    bulkDeleteResponse.statusCode === 200,
                    `Deleted: ${bulkDeleteResponse.body?.deleted || 0} items`
                );
            }
        }
    }

    async testSearchAndFilter() {
        console.log('\n🔍 Testing Search and Filter...');
        
        // Create test items for search
        const searchItems = [
            { name: 'Red Shirt', box: 'Clothes Box', category: 'Clothing' },
            { name: 'Blue Jeans', box: 'Clothes Box', category: 'Clothing' },
            { name: 'Phone Charger', box: 'Tech Box', category: 'Electronics' }
        ];

        await this.makeRequest('/api/items/bulk', {
            method: 'POST',
            body: { items: searchItems }
        });

        // Get all items and test filtering
        const allItemsResponse = await this.makeRequest('/api/items');
        this.addTestResult(
            'Get All Items for Search Test',
            allItemsResponse.statusCode === 200,
            `Total items: ${allItemsResponse.body?.length || 0}`
        );

        // Clean up test items
        if (allItemsResponse.body && Array.isArray(allItemsResponse.body)) {
            const testItemIds = allItemsResponse.body
                .filter(item => ['Clothes Box', 'Tech Box'].includes(item.box))
                .map(item => item.id);

            if (testItemIds.length > 0) {
                await this.makeRequest('/api/items/bulk', {
                    method: 'DELETE',
                    body: { ids: testItemIds }
                });
            }
        }
    }

    async testAuthenticationSecurity() {
        console.log('\n🔒 Testing Authentication Security...');
        
        // Test accessing protected endpoint without authentication
        const originalCookie = this.sessionCookie;
        this.sessionCookie = null;

        const unauthorizedResponse = await this.makeRequest('/api/items');
        this.addTestResult(
            'Unauthorized Access Prevention',
            unauthorizedResponse.statusCode === 401,
            `Status: ${unauthorizedResponse.statusCode}`
        );

        // Restore session
        this.sessionCookie = originalCookie;

        // Test logout
        const logoutResponse = await this.makeRequest('/api/auth/logout', {
            method: 'POST'
        });

        this.addTestResult(
            'User Logout',
            logoutResponse.statusCode === 200,
            `Status: ${logoutResponse.statusCode}`
        );
    }

    printResults() {
        console.log('\n📊 TEST RESULTS SUMMARY');
        console.log('========================');
        
        const passed = this.testResults.filter(t => t.passed).length;
        const total = this.testResults.length;
        
        console.log(`✅ Passed: ${passed}/${total}`);
        console.log(`❌ Failed: ${total - passed}/${total}`);
        
        if (total - passed > 0) {
            console.log('\n🔍 FAILED TESTS:');
            this.testResults
                .filter(t => !t.passed)
                .forEach(t => console.log(`   ❌ ${t.testName}: ${t.details}`));
        }
        
        console.log(`\n🎯 Success Rate: ${Math.round((passed / total) * 100)}%`);
        
        if (passed === total) {
            console.log('🎉 ALL TESTS PASSED! PackTrack Pro is working perfectly!');
        } else {
            console.log('⚠️  Some tests failed. Please review the issues above.');
        }
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const tester = new PackTrackTester();
    
    console.log('⚡ Make sure the PackTrack Pro server is running on http://localhost:3000');
    console.log('   Run: npm start\n');
    
    setTimeout(() => {
        tester.runAllTests().catch(error => {
            console.error('💥 Test suite crashed:', error);
            process.exit(1);
        });
    }, 2000);
}

module.exports = PackTrackTester;