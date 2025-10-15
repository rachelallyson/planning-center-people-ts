# Release Notes - Version 2.7.0

## 🚀 Rate Limiting Improvements

This release updates the rate limiting implementation to match Planning Center's actual API specifications and adds enhanced error handling capabilities.

### ✨ New Features

#### **Updated Rate Limits**

- **Corrected default rate limits**: Now uses 100 requests per 20 seconds (was 100 per 60 seconds)
- **Dynamic period adjustment**: Automatically adapts to server-provided time periods via `X-PCO-API-Request-Rate-Period` header
- **Future-proof**: Will automatically adjust if PCO changes their rate limits

#### **Enhanced Error Handling**

- **429 Error Parsing**: New `parseRateLimitError()` method extracts detailed information from rate limit error responses
- **Error Message Parsing**: Handles error messages like `"Rate limit exceeded: 118 of 100 requests per 20 seconds"`
- **Improved Debugging**: Better visibility into rate limit status and remaining requests

### 🔧 Improvements

#### **Header Synchronization**

- **Period Header Support**: Now properly parses and uses `X-PCO-API-Request-Rate-Period` header
- **Dynamic Window Adjustment**: Rate limiter window automatically adjusts based on server responses
- **Better Server Sync**: More accurate rate limit tracking that stays in sync with PCO's servers

#### **Documentation Updates**

- **Updated Examples**: All documentation now reflects the correct 20-second rate limit window
- **Configuration Examples**: Updated client configuration examples with proper rate limiting settings
- **API Reference**: Enhanced rate limiting documentation with new features

### 🧪 Testing

#### **Comprehensive Test Coverage**

- **22 Rate Limiter Tests**: All passing with new 20-second window
- **Error Parsing Tests**: New tests for 429 error response parsing
- **Header Parsing Tests**: Tests for dynamic period adjustment
- **Edge Case Coverage**: Robust testing of rate limit edge cases

### 📚 Breaking Changes

**None** - This is a backward-compatible update. Existing code will continue to work, but will now use the correct rate limits.

### 🔄 Migration

No migration required. The changes are automatically applied:

```typescript
// Before (v2.6.x) - Incorrect limits
const client = createPcoClient({
  // Used 100 requests per 60 seconds
});

// After (v2.7.0) - Correct limits
const client = createPcoClient({
  // Now uses 100 requests per 20 seconds
  // Automatically adjusts based on server headers
});
```

### 🎯 Benefits

1. **Compliance**: Now correctly follows Planning Center's actual API rate limits
2. **Reliability**: Better rate limit handling reduces 429 errors
3. **Performance**: More accurate rate limiting improves API efficiency
4. **Future-Proof**: Automatically adapts to PCO rate limit changes
5. **Debugging**: Enhanced error information for better troubleshooting

### 📦 Installation

```bash
npm install @rachelallyson/planning-center-people-ts@2.7.0
```

### 🔗 Related

- **Rate Limiting Documentation**: [docs/API_USAGE_GUIDE.md](docs/API_USAGE_GUIDE.md#rate-limit-management)
- **Error Handling Guide**: [docs/API_USAGE_GUIDE.md](docs/API_USAGE_GUIDE.md#error-handling)
- **Migration Guide**: [docs/MIGRATION_V2.md](docs/MIGRATION_V2.md)

---

**Full Changelog**: [2.6.4...2.7.0](https://github.com/rachelallyson/planning-center-people-ts/compare/v2.6.4...v2.7.0)
