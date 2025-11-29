# URL Parameters

LibreChat supports URL parameters that allow you to control the chat interface behavior, specify conversations, and automate interactions through the URL query string.

## Supported Parameters

### UI Control Parameters

#### `sidebar`
Controls the visibility of the left sidebar.

- **Values**: `hidden` | `visible`
- **Default**: `visible` (or last saved state in localStorage)
- **Example**: `http://localhost:3080/c/new?sidebar=hidden`

**Behavior**:
- `sidebar=hidden`: Hides the sidebar on page load
- `sidebar=visible`: Shows the sidebar on page load
- No parameter: Uses the last saved state from localStorage
- Users can still manually toggle the sidebar after page load

#### `navbar`
Controls the visibility of the top navigation bar (GovHeader).

- **Values**: `hidden` | `visible`
- **Default**: `visible`
- **Example**: `http://localhost:3080/c/new?navbar=hidden`

**Behavior**:
- `navbar=hidden`: Completely hides the navigation bar and adjusts layout to use full vertical space
- `navbar=visible`: Shows the navigation bar (default behavior)
- No parameter: Shows the navigation bar

### Conversation Parameters

#### `conversationId`
Loads a specific conversation by its ID.

- **Values**: Any valid conversation ID string
- **Example**: `http://localhost:3080/c/new?conversationId=abc123`

**Behavior**:
- Loads and displays the specified conversation
- If the conversation doesn't exist or user lacks access, shows an error toast and redirects to new conversation
- Takes precedence over `agentId` parameter if both are provided

#### `agentId`
Initializes a new conversation with a specific agent.

- **Values**: Any valid agent ID string
- **Example**: `http://localhost:3080/c/new?agentId=agent456`

**Behavior**:
- Creates a new conversation with the specified agent
- Only used when `conversationId` is not provided
- If the agent doesn't exist or user lacks access, shows an error toast and uses default agent

### Message Parameters

#### `message`
Pre-fills the message input field with specified text.

- **Values**: URL-encoded text string
- **Example**: `http://localhost:3080/c/new?message=Hello%20World`

**Behavior**:
- Decodes the URL-encoded message and populates the input field
- Supports all special characters when properly URL-encoded
- Message remains editable by the user

#### `autoSend`
Automatically sends the pre-filled message after page load.

- **Values**: `true` | `false`
- **Default**: `false`
- **Example**: `http://localhost:3080/c/new?message=Hello&autoSend=true`

**Behavior**:
- Only works when `message` parameter is also provided
- Waits for conversation context to be fully initialized before sending
- If sending fails, displays error toast and retains message in input field
- Executes only once per page load

## Parameter Precedence

When multiple parameters affect the same functionality:

1. **Conversation Selection**: `conversationId` > `agentId`
   - If both are provided, `conversationId` is used and `agentId` is ignored

2. **Sidebar Visibility**: URL parameter > localStorage > default
   - URL parameter takes precedence over saved preferences

3. **Auto-send Requirement**: Requires both `message` and `autoSend=true`
   - `autoSend=true` without `message` is ignored

## Usage Examples

### Embedded Chat Interface

Create a minimal chat interface for embedding in iframes:

```
http://localhost:3080/c/new?sidebar=hidden&navbar=hidden
```

### Deep Link to Conversation

Share a direct link to a specific conversation:

```
http://localhost:3080/c/new?conversationId=abc123
```

### Start Chat with Specific Agent

Initialize a conversation with a particular agent:

```
http://localhost:3080/c/new?agentId=agent456
```

### Pre-filled Message

Open chat with a pre-filled question:

```
http://localhost:3080/c/new?message=What%20is%20the%20weather%20today%3F
```

### Automated Query

Automatically send a query (useful for automation workflows):

```
http://localhost:3080/c/new?message=Analyze%20this%20data&autoSend=true
```

### Combined Parameters

Use multiple parameters together for complex scenarios:

```
http://localhost:3080/c/new?sidebar=hidden&navbar=hidden&agentId=agent456&message=Hello&autoSend=true
```

This example:
- Hides both sidebar and navbar for a clean interface
- Starts a conversation with agent456
- Pre-fills "Hello" as the message
- Automatically sends the message

## URL Encoding

When passing text in the `message` parameter, ensure proper URL encoding:

- Spaces: `%20` or `+`
- Question marks: `%3F`
- Ampersands: `%26`
- Equals signs: `%3D`
- Special characters: Use `encodeURIComponent()` in JavaScript

**JavaScript Example**:
```javascript
const message = "What is 2 + 2?";
const url = `http://localhost:3080/c/new?message=${encodeURIComponent(message)}`;
```

## Error Handling

### Invalid Parameter Values

- Invalid values for `sidebar` or `navbar` are ignored, and default behavior is used
- Invalid `conversationId` or `agentId` shows an error toast and loads default view

### Auto-send Failures

If auto-send fails:
- Error toast is displayed with details
- Message text is retained in the input field
- User can manually retry sending

### Access Denied

If user lacks access to specified conversation or agent:
- Error toast is displayed
- System falls back to default view or agent

## Troubleshooting

### Message Not Auto-sending

**Possible causes**:
1. `message` parameter is missing
2. `autoSend` is not set to `true`
3. Conversation is not fully initialized yet
4. Network error or validation failure

**Solution**: Check browser console for error messages and ensure both parameters are correctly set.

### Sidebar/Navbar Still Visible

**Possible causes**:
1. Parameter value is misspelled (must be exactly `hidden` or `visible`)
2. Parameter is not in the URL query string
3. Browser cached old state

**Solution**: Verify URL parameters are correct and try hard refresh (Ctrl+Shift+R or Cmd+Shift+R).

### Conversation Not Loading

**Possible causes**:
1. Conversation ID doesn't exist
2. User doesn't have access to the conversation
3. Network error

**Solution**: Check browser console and network tab for errors. Verify the conversation ID is correct.

## Security Considerations

- All URL parameters are validated before use
- User access permissions are checked for conversations and agents
- Message content is properly escaped to prevent XSS attacks
- Invalid parameters are safely ignored without breaking functionality

## Browser Compatibility

URL parameters feature is compatible with:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- All modern browsers supporting URLSearchParams API

## Future Enhancements

Planned features for future releases:
- Parameter persistence to localStorage
- UI for generating shareable links with parameters
- Support for hiding additional UI elements
- Preset configuration loading via URL
- Multiple message queue support
