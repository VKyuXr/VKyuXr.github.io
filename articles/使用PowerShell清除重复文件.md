```PowerShell
Get-ChildItem *.* -recurse
	| Get-Filehash 
	| Group-Object -property hash 
	| Where-Object { $_.count -gt 1 } 
	| %{ $_.group 
	| select -skip 1 } 
	| Remove-Item
```
