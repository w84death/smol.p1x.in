; Example Assembly Program
; Demonstration of smol ASM Viewer
;
; Description:
;   This is a simple example to demonstrate how the smol ASM Viewer formats and displays assembly code.
;   It shows how titles, descriptions, and code sections are rendered.
;
ORG 100h
USE16
;
; === Initialization ===
; This section initializes the data segment and registers.
MOV AX, @DATA      ; Load data segment address
MOV DS, AX         ; Initialize data segment
XOR AX, AX         ; Clear AX register
MOV CX, 10         ; Set loop counter to 10
;
; === Main Loop ===
; Performs a simple loop operation.
LOOP_START:
    INC AX         ; Increment AX
    DEC CX         ; Decrement loop counter
    JNZ LOOP_START ; Jump if CX not zero
;
; === Termination ===
; Ends the program execution gracefully.
MOV AH, 4Ch        ; DOS terminate program function
INT 21h            ; Call DOS interrupt
