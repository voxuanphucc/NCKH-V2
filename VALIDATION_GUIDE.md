# Validation & Toast Notifications Guide

## Tổng quan

Dự án đã được cập nhật với hệ thống validation toàn diện và hệ thống thông báo toast cho tất cả các API endpoints.

## ✅ Features Được Thêm

### 1. **React Toastify Integration**

- Cài đặt: `npm install react-toastify`
- Đã thêm `ToastContainer` vào `src/App.tsx`
- CSS được import tự động

### 2. **Validation Rules Toàn Diện**

File: `src/utils/validation.ts`

Validation rules dựa trên API specification cho:

- **Address**: formattedAddress, addressLine, ward, district, city, province, country, latitude, longitude, fromDate, toDate
- **Tree**: name, description
- **Person**: firstName, lastName, gender, dateOfBirth, dateOfDeath, citizenIdentificationNumber
- **Event**: name, description, startedAt, endedAt
- **Authentication**: userName, email, password, confirmPassword, phoneNumber
- **User**: firstName, lastName, phoneNumber, dateOfBirth
- **Invitation**: email, role
- **Media**: file (size, type), mediaFileTypeId

### 3. **Services Updated Với Validation**

Tất cả services đã được cập nhật để validate dữ liệu trước khi gửi request:

- ✅ authService.ts - login/register validation
- ✅ treeService.ts - tree CRUD validation
- ✅ personService.ts - person update validation
- ✅ familyService.ts - family operations validation
- ✅ addressService.ts - address CRUD validation
- ✅ eventService.ts - event operations validation
- ✅ invitationService.ts - invitation validation
- ✅ userService.ts - user profile validation
- ✅ mediaService.ts - media upload validation

### 4. **Axios Error Handling**

File: `src/config/axios.ts`

Tự động show toast notifications cho:

- **401 Unauthorized**: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại"
- **403 Forbidden**: "Bạn không có quyền để thực hiện hành động này"
- **404 Not Found**: "Tài nguyên không được tìm thấy"
- **409 Conflict**: "Xung đột dữ liệu"
- **5xx Server Error**: "Lỗi máy chủ, vui lòng thử lại sau"
- **Các lỗi khác**: Hiển thị message từ API

## 📖 Cách Sử Dụng

### 1. **Validate một field đơn lẻ**

```typescript
import { validateField, showErrorToast } from "@/utils/validation";

const error = validateField("auth", "email", "invalid-email");
if (error) {
  showErrorToast(error);
}
```

### 2. **Validate toàn bộ object**

```typescript
import { validateObject, showErrorToast } from "@/utils/validation";

const data = { firstName: "John", email: "invalid" };
const errors = validateObject("auth", data);

if (errors.length > 0) {
  errors.forEach((err) => showErrorToast(err.message));
}
```

### 3. **Validate + Show errors cùng lúc**

```typescript
import { validateAndShowErrors } from "@/utils/validation";

const isValid = validateAndShowErrors("auth", formData);
if (!isValid) return; // Dừng xử lý nếu validation thất bại

// Tiếp tục gửi request...
```

### 4. **Show Toast Notifications**

```typescript
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  showWarningToast,
} from "@/utils/validation";

showSuccessToast("Cây gia phả đã được tạo thành công!");
showErrorToast("Lỗi: Tên cây gia phả không được để trống");
showInfoToast("Đang tải dữ liệu...");
showWarningToast("Bạn sắp rời khỏi cây");
```

## 🔍 Validation Rules Chi Tiết

### Address Validation

```typescript
- formattedAddress: Bắt buộc, < 500 ký tự
- addressLine: Bắt buộc, < 200 ký tự
- ward: Tùy chọn, < 100 ký tự
- district: Tùy chọn, < 100 ký tự
- city: Tùy chọn, < 100 ký tự
- province: Tùy chọn, < 100 ký tự
- country: Tùy chọn, < 100 ký tự
- latitude: -90 to 90
- longitude: -180 to 180
- fromDate: Bắt buộc, phải là ngày hợp lệ
- toDate: Tùy chọn, phải >= fromDate
```

### Person Validation

```typescript
- firstName: Bắt buộc, 2-100 ký tự
- lastName: Bắt buộc, 2-100 ký tự
- gender: Bắt buộc (MALE/FEMALE)
- dateOfBirth: Tùy chọn, <= ngày hôm nay
- dateOfDeath: Tùy chọn, <= ngày hôm nay, >= dateOfBirth
- citizenIdentificationNumber: 9 hoặc 12 chữ số
```

### Authentication Validation

```typescript
- userName: 3-50 ký tự, chỉ có a-z, 0-9, _, ., -
- email: Định dạng email hợp lệ
- password: >= 6 ký tự, <= 100 ký tự
- confirmPassword: Phải trùng với password
- phoneNumber: 10-15 chữ số
```

### Tree Validation

```typescript
- name: Bắt buộc, 2-255 ký tự
- description: Tùy chọn, < 1000 ký tự
```

### Event Validation

```typescript
- name: Bắt buộc, 2-255 ký tự
- description: Tùy chọn, < 1000 ký tự
- startedAt: Bắt buộc, ngày hợp lệ
- endedAt: Tùy chọn, >= startedAt
```

### Invitation Validation

```typescript
- email: Bắt buộc, định dạng email hợp lệ
- role: Bắt buộc (VIEWER, EDITOR, ADMIN, OWNER)
```

### Media Validation

```typescript
- file: Bắt buộc, <= 50MB
- mediaFileTypeId: Bắt buộc
```

## 🚀 Ví Dụ Thực Tế

### Ví dụ 1: Login Form Validation

```typescript
import { authService } from "@/services/authService";
import { showSuccessToast } from "@/utils/validation";

const handleLogin = async (userName: string, password: string) => {
  try {
    const response = await authService.login({ userName, password });
    showSuccessToast("Đăng nhập thành công!");
    // Xử lý thành công...
  } catch (error) {
    // Error toast đã được show tự động từ validation hoặc axios
  }
};
```

### Ví dụ 2: Tree Creation With Validation

```typescript
import { treeService } from "@/services/treeService";
import { showSuccessToast } from "@/utils/validation";

const handleCreateTree = async (name: string, description: string) => {
  try {
    const response = await treeService.createTree({
      name,
      description,
    });
    showSuccessToast("Cây gia phả đã được tạo thành công!");
    // Chuyển hướng đến trang chi tiết tree...
  } catch (error) {
    // Error toast đã được show
  }
};
```

### Ví dụ 3: Address Management

```typescript
import { addressService } from "@/services/addressService";
import { showSuccessToast } from "@/utils/validation";

const handleAddAddress = async (
  treeId: string,
  personId: string,
  addressData: any,
) => {
  try {
    const response = await addressService.addPersonAddress(
      treeId,
      personId,
      addressData,
    );
    showSuccessToast("Địa chỉ đã được thêm thành công!");
  } catch (error) {
    // Error validation sẽ show trước (tự động)
    // API error cũng sẽ show (tự động)
  }
};
```

## 🌐 Error Handling Flow

```
User Action
    ↓
Component Form
    ↓
Call Service Method
    ↓
Service Validates Input → Show Error Toast (nếu có lỗi)
    ↓
If Valid → Make API Request
    ↓
API Response with Error → Axios Handler
    ↓
Show Error Toast (dựa trên status code)
    ↓
If Success → Axios Handler passes data to service
    ↓
Component Gets Response → Show Success Toast
    ↓
Update State / Navigate
```

## 📋 Checklist Validation Tất Cả API

### ✅ Address API

- [x] GET /api/v1/trees/{treeId}/persons/{personId}/addresses
- [x] POST /api/v1/trees/{treeId}/persons/{personId}/addresses (with validation)
- [x] PUT /api/v1/trees/{treeId}/persons/{personId}/addresses/{addressId} (with validation)
- [x] DELETE /api/v1/trees/{treeId}/persons/{personId}/addresses/{addressId}
- [x] GET /api/v1/trees/{treeId}/addresses
- [x] POST /api/v1/trees/{treeId}/addresses (with validation)
- [x] PUT /api/v1/trees/{treeId}/addresses/{addressId} (with validation)
- [x] DELETE /api/v1/trees/{treeId}/addresses/{addressId}

### ✅ Tree API

- [x] GET /api/v1/trees/{treeId}
- [x] PUT /api/v1/trees/{treeId} (with validation)
- [x] DELETE /api/v1/trees/{treeId}
- [x] POST /api/v1/trees (with validation)
- [x] POST /api/v1/trees/{treeId}/leave
- [x] PATCH /api/v1/trees/{treeId}/members/{targetUserId}/role
- [x] GET /api/v1/trees/{treeId}/members
- [x] GET /api/v1/trees/my
- [x] DELETE /api/v1/trees/{treeId}/members/{targetUserId}

### ✅ Person API

- [x] GET /api/v1/persons/{id}
- [x] PUT /api/v1/persons/{id} (with validation)
- [x] DELETE /api/v1/persons/{id}
- [x] GET /api/v1/persons (search)
- [x] POST /api/v1/persons (handled by familyService.createFirstPerson)

### ✅ Family API

- [x] GET /api/v1/trees/{treeId}/graph
- [x] GET /api/v1/trees/{treeId}/persons/{personId}/family
- [x] POST /api/v1/trees/{treeId}/persons/first (with validation)
- [x] POST /api/v1/trees/{treeId}/persons/{personId}/spouse (with validation)
- [x] POST /api/v1/trees/{treeId}/persons/{personId}/parent (with validation)
- [x] POST /api/v1/trees/{treeId}/families/{familyId}/child (with validation)
- [x] DELETE /api/v1/trees/{treeId}/families/{familyId}
- [x] DELETE /api/v1/trees/{treeId}/families/{familyId}/children/{personId}

### ✅ Event API

- [x] GET /api/v1/trees/{treeId}/events
- [x] POST /api/v1/trees/{treeId}/events (with validation)
- [x] GET /api/v1/trees/{treeId}/events/{eventId}
- [x] DELETE /api/v1/trees/{treeId}/events/{eventId}
- [x] POST /api/v1/trees/{treeId}/events/{eventId}/persons
- [x] GET /api/v1/trees/{treeId}/events/persons/{personId}
- [x] DELETE /api/v1/trees/{treeId}/events/{eventId}/persons/{personId}

### ✅ Invitation API

- [x] GET /api/v1/trees/{treeId}/share-links
- [x] POST /api/v1/trees/{treeId}/share-links
- [x] DELETE /api/v1/trees/{treeId}/share-links/{shareLinkId}
- [x] POST /api/v1/trees/{treeId}/invitations (with validation)
- [x] POST /api/v1/invitations/accept
- [x] GET /api/v1/share
- [x] GET /api/v1/share/graph

### ✅ Lookup API

- [x] GET /api/v1/lookup/role-in-events
- [x] GET /api/v1/lookup/media-file-types
- [x] GET /api/v1/lookup/event-types
- [x] GET /api/v1/lookup/address-types

### ✅ User API

- [x] GET /api/v1/users/me
- [x] PUT /api/v1/users/me (with validation)
- [x] PATCH /api/v1/users/me/password (with validation)
- [x] GET /api/v1/users/{id}

### ✅ Media API

- [x] GET /api/v1/trees/{treeId}/media
- [x] POST /api/v1/trees/{treeId}/media (with validation)
- [x] DELETE /api/v1/trees/{treeId}/media/{mediaFileId}
- [x] GET /api/v1/trees/{treeId}/persons/{personId}/media
- [x] POST /api/v1/trees/{treeId}/persons/{personId}/media (with validation)

### ✅ Authentication API

- [x] POST /api/v1/auth/login (with validation)
- [x] POST /api/v1/auth/register (with validation)
- [x] GET /api/v1/auth/oauth2/authorize/google
- [x] GET /api/v1/auth/oauth2/callback/google

## 🎯 Lợi Ích Của Hệ Thống Validation Mới

1. **Validation Tự Động**: Tất cả input được validate trước khi gửi request
2. **User Feedback**: Toast notifications hiển thị lỗi rõ ràng
3. **API Error Handling**: Các lỗi API được xử lý thống nhất
4. **Type-Safe**: Sử dụng TypeScript để validate types
5. **Reusable**: Validation rules có thể tái sử dụng
6. **Consistent UX**: Tất cả lỗi hiển thị theo cách nhất quán
7. **Security**: Validate trước khi gửi giảm tải server

## 🔧 Maintenance

Nếu muốn thêm validation rules mới:

1. Thêm vào `validationRules` object trong `src/utils/validation.ts`
2. Follow format: `(value: any, additionalValue?: any) => string | null`
3. Return `null` nếu valid, return error message nếu invalid
4. Sử dụng trong service như các ví dụ trên

Ví dụ thêm validation rule mới:

```typescript
// Thêm vào object validationRules
customField: (value: string) => {
  if (!value) {
    return "Custom field không được để trống";
  }
  return null;
};
```
