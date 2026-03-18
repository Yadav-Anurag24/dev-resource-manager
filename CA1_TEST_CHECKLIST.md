# CA1 Manual Test Checklist - Developer Resource Manager

Use this checklist during demo rehearsal and include screenshots or Postman captures for each case.

## Setup
- Server starts with npm run dev.
- App opens at http://localhost:3000.
- MongoDB is connected.

## API and UI Core Flows

1. Create Resource (valid)
- Action: Submit add form with valid values.
- Expected: 201 response from API and resource visible in list/details.
- Status: [ ] Pass  [ ] Fail
- Evidence: ____________________

2. Create Resource (invalid title)
- Action: Submit title shorter than 3 chars.
- Expected: 400 response with validation errors.
- Status: [ ] Pass  [ ] Fail
- Evidence: ____________________

3. Create Resource (missing required fields)
- Action: Leave required fields empty and submit.
- Expected: 400 response with clear messages.
- Status: [ ] Pass  [ ] Fail
- Evidence: ____________________

4. List Resources
- Action: Open home page.
- Expected: Table shows existing records; no crash.
- Status: [ ] Pass  [ ] Fail
- Evidence: ____________________

5. Search by title
- Action: Enter keyword in search and apply filter.
- Expected: Matching records only.
- Status: [ ] Pass  [ ] Fail
- Evidence: ____________________

6. Filter by category and difficulty
- Action: Select category/difficulty and apply.
- Expected: Only matching resources displayed.
- Status: [ ] Pass  [ ] Fail
- Evidence: ____________________

7. Get single resource by valid ID
- Action: Open details page from list.
- Expected: Correct resource details appear.
- Status: [ ] Pass  [ ] Fail
- Evidence: ____________________

8. Update Resource (valid)
- Action: Edit a resource with valid data.
- Expected: 200 response and updated values in details/list.
- Status: [ ] Pass  [ ] Fail
- Evidence: ____________________

9. Update Resource (invalid payload)
- Action: Edit resource with invalid input (e.g., short description).
- Expected: 400 response with validation errors.
- Status: [ ] Pass  [ ] Fail
- Evidence: ____________________

10. Delete Resource (valid ID)
- Action: Delete a resource from list/details.
- Expected: 200 response and resource removed.
- Status: [ ] Pass  [ ] Fail
- Evidence: ____________________

## Error Handling Scenarios

11. Invalid resource ID on details
- Action: Call GET /api/resources/invalid-id.
- Expected: 400 with "Invalid resource ID".
- Status: [ ] Pass  [ ] Fail
- Evidence: ____________________

12. Invalid resource ID on update
- Action: Call PUT /api/resources/invalid-id.
- Expected: 400 with "Invalid resource ID".
- Status: [ ] Pass  [ ] Fail
- Evidence: ____________________

13. Invalid resource ID on delete
- Action: Call DELETE /api/resources/invalid-id.
- Expected: 400 with "Invalid resource ID".
- Status: [ ] Pass  [ ] Fail
- Evidence: ____________________

14. Non-existing but valid ObjectId
- Action: Call GET/PUT/DELETE with a valid but absent ObjectId.
- Expected: 404 with "Resource not found".
- Status: [ ] Pass  [ ] Fail
- Evidence: ____________________

15. Unknown API route
- Action: Call /api/unknown.
- Expected: 404 JSON response "API endpoint not found".
- Status: [ ] Pass  [ ] Fail
- Evidence: ____________________

## CA1 Sign-off
- Total Passed: ____ / 15
- Final Decision: [ ] CA1 Ready  [ ] Needs Fixes
- Reviewer Name: ____________________
- Date: ____________________
