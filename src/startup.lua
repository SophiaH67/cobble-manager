local myURL = "wss://sea-turtle-app-f38lv.ondigitalocean.app/"
http.websocketAsync(myURL)
local event, url, handle
repeat
	event, url, handle = os.pullEvent("websocket_success")
until url == myURL

print("Connected to websocket server")

local State = {
	OFF = "off",
	ON = "on",
}

local state = State.OFF

function update_server_state(new_state)
	local message = {
		type = "set",
		state = new_state,
	}
	handle.send(textutils.serialiseJSON(message))
end

function turn_on_cobblestone_generator()
	redstone.setOutput("top", true)
	update_server_state(State.ON)
end

function turn_off_cobblestone_generator()
	redstone.setOutput("top", false)
	update_server_state(State.OFF)
end

turn_on_cobblestone_generator()

while true do
	local event, url, message
	repeat
		event, url, message = os.pullEvent("websocket_message")
	until url == myURL

	parsed = textutils.unserialiseJSON(message)

	if parsed.type == "set" then
		if parsed.state == State.ON then
			turn_on_cobblestone_generator()
		elseif parsed.state == State.OFF then
			turn_off_cobblestone_generator()
		end
	end
end
