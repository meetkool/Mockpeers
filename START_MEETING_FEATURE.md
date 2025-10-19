# Start Meeting Feature - Admin Control

## 🎯 Feature Overview
Added a "Start Meeting" button that allows admins to manually start meetings early, changing the status from `PENDING` or `BOOKING_STARTED` to `ACTIVE`.

## 📋 Changes Made

### 1. **New API Endpoint**
**File:** `app/api/admin/schedule/[id]/start/route.ts`

- **Route:** `POST /api/admin/schedule/[id]/start`
- **Authentication:** Admin only
- **Function:** Changes schedule status to `ACTIVE` and sets `startedAt` timestamp

**Allowed Transitions:**
- `PENDING` → `ACTIVE` ✅
- `BOOKING_STARTED` → `ACTIVE` ✅
- `ACTIVE` → (already active) ❌
- `DONE` → (cannot restart) ❌

### 2. **Frontend Button**
**File:** `app/admin/components/InterviewScheduleDetail.tsx`

**Added:**
- ▶️ **"Start Meeting"** button with Play icon
- Green styling (`bg-green-50 hover:bg-green-100 text-green-700`)
- Shows when status is `PENDING` or `BOOKING_STARTED`
- Loading state while starting

## 🎨 Button Layout

The action buttons now appear in this order:

```
┌──────────────────────────────────────────────────────────────────┐
│  [Close Booking]  [Start Meeting]  [End Meeting]  [Enter Room]  │
└──────────────────────────────────────────────────────────────────┘
```

### Button Visibility Logic:

| Status | Close Booking | Reopen Booking | Start Meeting | End Meeting | Enter Room |
|--------|---------------|----------------|---------------|-------------|------------|
| **PENDING** | ✅ (if open) | ✅ (if closed) | ✅ | ❌ | ✅ |
| **BOOKING_STARTED** | ✅ (if open) | ✅ (if closed) | ✅ | ✅ | ✅ |
| **ACTIVE** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **DONE** | ❌ | ❌ | ❌ | ❌ | ✅ |

## 🔄 Status Flow with New Feature

```
PENDING
   ↓ (user joins or admin adds user)
BOOKING_STARTED
   ↓ (admin clicks "Start Meeting" OR time reaches start time)
ACTIVE
   ↓ (admin clicks "End Meeting" OR time reaches end time)
DONE
```

## 💡 Use Cases

### When to Use "Start Meeting":

1. **Early Start**: Admin wants to start the meeting before scheduled time
2. **Emergency Session**: Need to begin immediately for urgent discussion
3. **All Participants Ready**: Everyone has joined early and wants to start
4. **Testing**: Admin testing the meeting room setup

### Example Scenario:
```
Scheduled Time: 10:30 PM
Current Time: 10:15 PM (15 minutes early)
Status: BOOKING_STARTED
Participants: 3 users joined

Admin sees all participants are ready
→ Admin clicks "Start Meeting"
→ Status changes to ACTIVE
→ Meeting can begin immediately!
```

## 🎯 What Happens When Admin Clicks "Start Meeting":

1. **API Call:** `POST /api/admin/schedule/[scheduleId]/start`
2. **Database Update:**
   - `status` → `ACTIVE`
   - `startedAt` → current timestamp
3. **UI Update:**
   - Status badge changes to "ACTIVE"
   - "Start Meeting" button disappears
   - "End Meeting" button appears
   - Success toast notification
4. **Participants:**
   - Can now enter the active meeting room
   - Meeting is officially in progress

## 🔧 Technical Details

### API Validation:
```typescript
✅ Checks admin authentication
✅ Verifies schedule exists
✅ Only allows PENDING or BOOKING_STARTED to start
❌ Prevents starting already active or completed meetings
```

### Frontend Handler:
```typescript
const handleStartMeeting = async () => {
  // Sets loading state
  // Calls API
  // Refreshes schedule data
  // Shows success/error toast
}
```

## 🎨 Button Styling

```css
Start Meeting Button:
- Background: Green (bg-green-50)
- Hover: Lighter green (hover:bg-green-100)
- Text: Dark green (text-green-700)
- Icon: Play icon (▶️)
```

## 📍 Where to Find It

Navigate to any schedule detail page:
```
http://localhost:3000/admin/schedule/system-design/[scheduleId]
```

You'll see the **"Start Meeting"** button when:
- Status is PENDING or BOOKING_STARTED
- You're logged in as admin

## ✨ Benefits

1. **Flexibility**: Don't wait for scheduled time if everyone's ready
2. **Control**: Admin has full control over meeting lifecycle
3. **User Experience**: Participants can start earlier if needed
4. **Emergency Response**: Can quickly activate meetings for urgent situations

---

**Status:** ✅ Complete and Ready
**Version:** 1.0.0
**Permissions:** Admin Only

