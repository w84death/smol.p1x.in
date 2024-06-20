; Set 320x200 256-color mode
org 0x100
use16

VGA_MEMORY_ADR equ 0xA000                   ; VGA memory address
DBUFFER_MEMORY_ADR equ 0x8000               ; Doublebuffer memory address
SCREEN_BUFFER_SIZE equ 0xFa00               ; Size of the VGA buffer size
STATE_ADR equ 0xfe00
STATE_ON equ 0x01
STATE_OVER equ 0x02

; game variables 01-0f
HEALTH_ADR equ 0x7e01
; aliens
ALIENS_ADR equ 0x7e10

start:
    mov ax,0x13                             ; Init VGA 320x200x256
    int 0x10                                ; Video BIOS interrupt

    push DBUFFER_MEMORY_ADR                 ; Set doublebuffer memory
    pop es                                  ; as target

    mov byte [STATE_ADR], 0x01
    mov byte [HEALTH_ADR], 0x04


    mov si, ALIENS_ADR
    mov cx, 0x08
    .l:
    rdtsc
    add ax, 320*24
    cmp ax, 320*176
    jb .ok
    and ax, 320*176
    .ok:
    mov [si-2], ax
    xor ax,ax
    add ax, cx
    mov [si], ax
    inc si
    inc si
    loop .l

    mov word [si], 0xffff

; main loop
game_loop:
    mov ax,0x1112
    mov cx,SCREEN_BUFFER_SIZE               ; Set buffer size to fullscreen
    rep stosw                               ; Fill the buffer with color


; draw mouse cursor
    mov ax, 0x0003
    int 0x33

    mov bx, 320
    mov ax, dx
    mul bx
    add ax, cx
    mov di, ax
    mov ax, 0x0f
    stosb


; get aliens

cmp byte [STATE_ADR], STATE_ON
jne skip_aliens_loop

  mov si, ALIENS_ADR
  ;mov cx, 4
  ;xor bx,bx
aliens_loop:

  rdtsc
  add ax, si
  xor ax, 0x1337
  and ax, 0x0f
  mov di, ax
  shl di, 1
  mov ax, [MLT+di]
  mov di,[si]
  add di, ax
  jnz .ok1
  inc di
  .ok1:
  cmp di, 320*176
  jb .ok2
  and di, 320*176
  .ok2:
  mov [si],di
  inc si
  inc si
  mov bl,[si]
  inc bl
  cmp bl, 0xff
  jb .continue
      dec byte [HEALTH_ADR]
      cmp byte [HEALTH_ADR], 0x0
      ja .game_on
      mov byte [STATE_ADR], STATE_OVER
      .game_on:
      rdtsc
      add ax, 320*24
      cmp ax, 320*176
      jb .ok
      and ax, 320*176
      .ok:
      mov [si-2], ax
      mov word [si], 0x0000
  .continue:
  mov byte [si], bl
  shr bl, 4
  add bl,0x10   ; grays 10-1f

; draw sprite
  push si
  mov si, UfoSpr
  call draw_sprite
  pop si

; move to next slot

  inc si
  inc si

  mov ax,[si]
  cmp ax,0xffff
  jnz aliens_loop

skip_aliens_loop:

draw_health_bar:
    xor cx,cx
    mov byte cl, [HEALTH_ADR]
    cmp cx,0x0
    jz .skip
    mov si, HealthSpr
    mov di, 320*4+4
    .l:
    mov bx, 0x04
    call draw_sprite
    add di, 16
    loop .l
    .skip:


    call vga_blit
    ; =========================================== DELAY CYCLE ======================

delay:
    push es
    push 0x0040
    pop es
    mov bx, [es:0x006C]  ; Load the current tick count into BX
wait_for_tick:
    mov ax, [es:0x006C]  ; Load the current tick count
    sub ax, bx           ; Calculate elapsed ticks
    jz wait_for_tick     ; If not enough time has passed, keep waiting
    pop es


    in al,60h                           ; Read keyboard
    dec al
    jnz game_loop

    ; Wait for a key press
    xor ax, ax
    int 0x16

    ; Return to text mode 0x03
    mov ax, 0x0003
    int 0x10

    ; Terminate program
    mov ax, 0x4C00
    int 0x21

; =========================================== VGA BLIT PROCEDURE ===============

vga_blit:
    push es
    push ds

    push VGA_MEMORY_ADR                     ; Set VGA memory
    pop es                                  ; as target
    push DBUFFER_MEMORY_ADR                 ; Set doublebuffer memory
    pop ds                                  ; as source
    mov cx,0x7D00                           ; Half of 320x200 pixels
    xor si,si                               ; Clear SI
    xor di,di                               ; Clear DI
    rep movsw                               ; Push words (2x pixels)

    pop ds
    pop es
    ret

; =========================================== DRAWING SPRITE PROCEDURE =========

draw_sprite:
    pusha
    mov dx,0x06                     ; Number of lines in the sprite
    .draw_row:
        mov al,[si]                         ; Get sprite row data
        mov cx,0x08                  ; 8 bits per row
        .draw_pixel:
            shl al,1                        ; Shift left to get the pixel out
            jnc .skip_pixel                 ; If carry flag is 0,skip
            mov [es:di],bl                  ; Carry flag is 1,set the pixel
        .skip_pixel:
            inc di                          ; Move to the next pixel position
            loop .draw_pixel                ; Repeat for all 8 pixels in the row
        inc si
    add di,312                  ; Move to the next line
    dec dx                                  ; Decrement row count
    jnz .draw_row                           ; Draw the next row
    popa
    ret


; Data segment

MLT dw -322,-318,318,322,-1,1,-320,320,0,0,0,0,0,0,0,0                    ; Movement Lookup Table
                                            ; 0 - up/left
                                            ; 1 - up/right
                                            ; 2 - down/left
                                            ; 3 - down/right

UfoSpr db 10011001b,01111110b,10000001b,01111110b,00100100b,01000010b
HealthSpr db 01100110b
db 10111111b
db 10111111b
db 11011111b
db 00111100b
db 00011000b

;times 510-($-$$) db 0
;dw 0xAA55
