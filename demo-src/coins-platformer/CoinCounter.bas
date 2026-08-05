Class
Extends text

Constructor()
  super("Coins: 0", 10, 10)
  self.setStyle(16, 255, 255, 255)
EndConstructor

function setScore(n)
  self.setText("Coins: " + string.str(n))
endfunction

EndClass
