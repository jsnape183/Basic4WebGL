Class extends Enemy

dim phase

Constructor(startHealth)
  super(startHealth)
  self.phase = 1
EndConstructor

function takeDamage(amount)
  super.takeDamage(amount / 2)
  self.phase = self.phase + 1
endfunction
