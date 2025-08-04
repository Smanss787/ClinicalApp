#!/usr/bin/env python3
"""
Simple LSL Test Server for React Native Clinical App
This server receives and displays EEG data streamed from the React Native app.
"""

import socket
import json
import struct
import threading
import time
from datetime import datetime

class LSLTestServer:
    def __init__(self, host='localhost', port=16571):
        self.host = host
        self.port = port
        self.server_socket = None
        self.clients = []
        self.running = False
        self.data_count = 0
        
    def start(self):
        """Start the LSL test server"""
        try:
            self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.server_socket.bind((self.host, self.port))
            self.server_socket.listen(5)
            
            self.running = True
            print(f"LSL Test Server started on {self.host}:{self.port}")
            print("Waiting for connections...")
            
            while self.running:
                try:
                    client_socket, address = self.server_socket.accept()
                    print(f"New connection from {address}")
                    
                    client_thread = threading.Thread(
                        target=self.handle_client,
                        args=(client_socket, address)
                    )
                    client_thread.daemon = True
                    client_thread.start()
                    self.clients.append(client_socket)
                    
                except socket.error as e:
                    if self.running:
                        print(f"Socket error: {e}")
                    break
                    
        except Exception as e:
            print(f"Server error: {e}")
        finally:
            self.stop()
    
    def handle_client(self, client_socket, address):
        """Handle individual client connections"""
        try:
            # Send handshake response
            handshake_response = {
                "type": "handshake_response",
                "status": "accepted",
                "timestamp": int(time.time() * 1000)
            }
            self.send_message(client_socket, handshake_response)
            
            while self.running:
                try:
                    # Receive message length
                    length_data = client_socket.recv(4)
                    if not length_data:
                        break
                    
                    message_length = struct.unpack('<I', length_data)[0]
                    
                    # Receive message content
                    message_data = b''
                    while len(message_data) < message_length:
                        chunk = client_socket.recv(message_length - len(message_data))
                        if not chunk:
                            break
                        message_data += chunk
                    
                    if len(message_data) == message_length:
                        message = message_data.decode('utf-8')
                        self.process_message(message, address)
                    
                except socket.error as e:
                    print(f"Client {address} error: {e}")
                    break
                    
        except Exception as e:
            print(f"Error handling client {address}: {e}")
        finally:
            try:
                client_socket.close()
                if client_socket in self.clients:
                    self.clients.remove(client_socket)
                print(f"Client {address} disconnected")
            except:
                pass
    
    def process_message(self, message, address):
        """Process received LSL messages"""
        try:
            data = json.loads(message)
            message_type = data.get('type', 'unknown')
            
            if message_type == 'handshake':
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Handshake from {address}")
                
            elif message_type == 'chunk':
                self.process_chunk(data, address)
                
            else:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Unknown message type: {message_type}")
                
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
        except Exception as e:
            print(f"Message processing error: {e}")
    
    def process_chunk(self, chunk_data, address):
        """Process EEG data chunks"""
        try:
            chunk_size = chunk_data.get('chunk_size', 0)
            channel_count = chunk_data.get('channel_count', 0)
            timestamp = chunk_data.get('timestamp', 0)
            data = chunk_data.get('data', [])
            
            self.data_count += chunk_size
            
            print(f"[{datetime.now().strftime('%H:%M:%S')}] "
                  f"Chunk from {address}: {chunk_size} samples, "
                  f"{channel_count} channels, "
                  f"Total samples: {self.data_count}")
            
            # Display first few samples for debugging
            if data and len(data) > 0:
                print(f"  Sample 0: {data[0][:min(4, len(data[0]))]}...")
                
        except Exception as e:
            print(f"Chunk processing error: {e}")
    
    def send_message(self, client_socket, message):
        """Send JSON message to client"""
        try:
            message_json = json.dumps(message)
            message_bytes = message_json.encode('utf-8')
            message_length = len(message_bytes)
            
            # Send length
            client_socket.send(struct.pack('<I', message_length))
            # Send message
            client_socket.send(message_bytes)
            
        except Exception as e:
            print(f"Send message error: {e}")
    
    def stop(self):
        """Stop the server"""
        self.running = False
        
        # Close all client connections
        for client in self.clients:
            try:
                client.close()
            except:
                pass
        self.clients.clear()
        
        # Close server socket
        if self.server_socket:
            try:
                self.server_socket.close()
            except:
                pass
        
        print("LSL Test Server stopped")

def main():
    """Main function to run the LSL test server"""
    print("LSL Test Server for React Native Clinical App")
    print("=" * 50)
    
    server = LSLTestServer(host='0.0.0.0')
    
    try:
        server.start()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.stop()

if __name__ == "__main__":
    main() 